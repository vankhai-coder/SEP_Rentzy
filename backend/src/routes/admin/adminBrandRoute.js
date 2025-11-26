import express from "express"
import { verifyJWTToken } from "../../middlewares/authMiddleware.js"
import { getAllBrands, updateBrand, createBrand } from "../../controllers/admin/adminBrandController.js"
import upload from "../../middlewares/multerConfig.js"

const router = express.Router()

router.use(verifyJWTToken)
router.use((req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." })
  }
  next()
})

router.get("/", getAllBrands)
router.post("/", upload.single("logo"), createBrand)
router.patch("/:brandId", upload.single("logo"), updateBrand)

export default router
