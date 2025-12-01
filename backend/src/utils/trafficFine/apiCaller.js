import axios from "axios";
import Tesseract from "tesseract.js";
import qs from "qs";
import tough from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import { extractTrafficViolations } from "./extractTrafficViolations.js";
import https from "https";

const { CookieJar } = tough;

// Disable SSL verification cho csgt.vn (giống như code mẫu)
// Set trước khi import axios để đảm bảo áp dụng
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Configuration constants
 */
const CONFIG = {
  BASE_URL: "https://www.csgt.vn",
  CAPTCHA_PATH: "/lib/captcha/captcha.class.php",
  FORM_ENDPOINT: "/?mod=contact&task=tracuu_post&ajax",
  RESULTS_URL: "https://www.csgt.vn/tra-cuu-phuong-tien-vi-pham.html",
  MAX_RETRIES: 5,
  HEADERS: {
    USER_AGENT:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    ACCEPT:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    CONTENT_TYPE: "application/x-www-form-urlencoded",
  },
};

/**
 * Creates and configures an axios instance with cookie support
 * @param {Object} existingJar - Optional existing cookie jar to reuse
 * @returns {Object} Configured axios instance
 */
export function createAxiosInstance(existingJar = null) {
  const jar = existingJar || new CookieJar();
  // Không thể dùng httpsAgent với axios-cookiejar-support
  // Chỉ dựa vào NODE_TLS_REJECT_UNAUTHORIZED = '0' đã set ở đầu file
  const instance = axios.create({
    jar,
    withCredentials: true,
    baseURL: CONFIG.BASE_URL,
    timeout: 30000, // 30 seconds timeout
    headers: {
      "User-Agent": CONFIG.HEADERS.USER_AGENT,
      Accept: CONFIG.HEADERS.ACCEPT,
    },
  });
  return wrapper(instance);
}

/**
 * Fetches captcha image using https module directly (bypass axios-cookiejar-support SSL issue)
 * @param {Object} jar - Cookie jar to store cookies
 * @returns {Promise<Buffer>} Captcha image buffer
 */
/**
 * Fetches captcha image (returns image buffer, not text)
 * Sử dụng axios instance giống như code mẫu để tránh lỗi SSL
 * @param {Object} jar - Cookie jar to store cookies
 * @returns {Promise<Buffer>} Captcha image buffer
 */
export async function getCaptchaImage(jar) {
  let lastError = null;
  
  // Retry logic với MAX_RETRIES lần
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      // Đảm bảo SSL config được set
      if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }

      // Tạo axios instance với jar để đảm bảo cookies được lưu
      const instance = createAxiosInstance(jar);
      
      console.log(`[getCaptchaImage] Attempt ${attempt}/${CONFIG.MAX_RETRIES}: Fetching captcha from: ${CONFIG.BASE_URL}${CONFIG.CAPTCHA_PATH}`);
      
      const image = await instance.get(CONFIG.CAPTCHA_PATH, {
        responseType: "arraybuffer",
        timeout: 30000, // 30 seconds
      });
      
      console.log(`[getCaptchaImage] Captcha fetched successfully, size: ${image.data?.length || 0} bytes`);
      
      if (!image.data || image.data.length === 0) {
        throw new Error("Captcha image is empty");
      }
      
      return Buffer.from(image.data);
    } catch (error) {
      lastError = error;
      console.error(`[getCaptchaImage] Attempt ${attempt}/${CONFIG.MAX_RETRIES} failed:`, {
        message: error.message,
        code: error.code,
        response: error.response?.status,
        responseData: error.response?.data,
      });
      
      // Nếu không phải lần thử cuối, đợi một chút rồi thử lại
      if (attempt < CONFIG.MAX_RETRIES) {
        const delay = attempt * 1000; // Exponential backoff: 1s, 2s, 3s, 4s
        console.log(`[getCaptchaImage] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Nếu tất cả các lần thử đều thất bại
  throw new Error(`Failed to get captcha image after ${CONFIG.MAX_RETRIES} attempts: ${lastError?.message || lastError?.code || 'Unknown error'}`);
}

/**
 * Submits form data with plate number and captcha
 * @param {Object} instance - Axios instance
 * @param {string} plate - License plate number
 * @param {string} captcha - Captcha text entered by user
 * @param {string} vehicleType - Vehicle type (1 = car, 2 = motorbike)
 * @returns {Promise<Object>} API response
 */
async function postFormData(instance, plate, captcha, vehicleType = "1") {
  const formData = qs.stringify({
    BienKS: plate,
    Xe: vehicleType,
    captcha,
    ipClient: "9.9.9.91",
    cUrl: "1",
  });

  return instance.post(CONFIG.FORM_ENDPOINT, formData, {
    headers: {
      "Content-Type": CONFIG.HEADERS.CONTENT_TYPE,
    },
  });
}

/**
 * Fetches traffic violation results
 * @param {Object} instance - Axios instance
 * @param {string} plate - License plate number
 * @param {string} vehicleType - Vehicle type (1 = car, 2 = motorbike)
 * @returns {Promise<Object>} Results page response
 */
async function getViolationResults(instance, plate, vehicleType = "1") {
  return instance.get(`${CONFIG.RESULTS_URL}?&LoaiXe=${vehicleType}&BienKiemSoat=${plate}`);
}

/**
 * Main function to call the traffic violation API from csgt.vn
 * @param {string} plate - License plate number
 * @param {string} captcha - Captcha text entered by user
 * @param {string} vehicleType - Vehicle type (1 = car, 2 = motorbike)
 * @returns {Promise<Array|null>} Extracted traffic violations or null on failure
 */
export async function callTrafficFineAPI(plate, captcha, vehicleType = "1", existingJar = null) {
  try {
    console.log(`[TrafficFineAPI] Fetching traffic violations for plate: ${plate}, vehicleType: ${vehicleType}`);
    
    const instance = createAxiosInstance(existingJar);

    console.log(`[TrafficFineAPI] Submitting form with plate: ${plate} and captcha: ${captcha}`);
    const response = await postFormData(instance, plate, captcha, vehicleType);

    // Handle failed captcha case
    if (response.data === 404) {
      throw new Error("Mã bảo mật không đúng. Vui lòng nhập lại.");
    }

    console.log(`[TrafficFineAPI] Getting violation results...`);
    const resultsResponse = await getViolationResults(instance, plate, vehicleType);
    
    console.log(`[TrafficFineAPI] Extracting violations from HTML...`);
    const violations = extractTrafficViolations(resultsResponse.data);

    console.log(`[TrafficFineAPI] Found ${violations.length} violations`);
    return violations;
  } catch (error) {
    console.error(
      `[TrafficFineAPI] Error fetching traffic violations for plate ${plate}:`,
      error.message
    );
    console.error(`[TrafficFineAPI] Error stack:`, error.stack);
    throw error; // Throw error để controller có thể xử lý
  }
}

