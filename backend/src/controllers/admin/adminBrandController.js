import Brand from "../../models/Brand.js"
import { Op } from "sequelize"
import cloudinary from "../../config/cloudinary.js"

export const getAllBrands = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query
    const where = {}
    if (search && search.trim()) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search.trim()}%` } },
        { country: { [Op.like]: `%${search.trim()}%` } },
      ]
    }
    if (category && ["car", "motorbike", "both"].includes(category)) {
      where.category = category
    }
    const pageNum = Math.max(parseInt(page), 1)
    const limitNum = Math.max(Math.min(parseInt(limit), 50), 1)
    const offset = (pageNum - 1) * limitNum

    const { count, rows } = await Brand.findAndCountAll({
      where,
      order: [["name", "ASC"]],
      limit: limitNum,
      offset,
    })

    const stats = {
      total: await Brand.count({ where: {} }),
      car: await Brand.count({ where: { category: "car" } }),
      motorbike: await Brand.count({ where: { category: "motorbike" } }),
      both: await Brand.count({ where: { category: "both" } }),
    }

    return res.status(200).json({
      items: rows,
      pagination: {
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalItems: count,
        totalPages: Math.ceil(count / limitNum),
      },
      stats,
    })
  } catch (error) {
    console.error("admin getAllBrands error:", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const updateBrand = async (req, res) => {
  try {
    const { brandId } = req.params
    const { name, country, logo_url, category } = req.body

    if (category && !["car", "motorbike", "both"].includes(category)) {
      return res.status(400).json({ message: "Invalid category" })
    }

    const brand = await Brand.findByPk(brandId)
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" })
    }

    const payload = {}
    if (typeof name === "string" && name.trim()) payload.name = name.trim()
    if (typeof country === "string") payload.country = country.trim()
    if (typeof logo_url === "string") payload.logo_url = logo_url.trim()
    if (category) payload.category = category

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "brands", resource_type: "image" },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(req.file.buffer)
      })
      payload.logo_url = uploadResult.secure_url
    }

    await brand.update(payload)
    return res.status(200).json({ message: "Updated", brand })
  } catch (error) {
    console.error("admin updateBrand error:", error)
    return res.status(500).json({ message: "Server error" })
  }
}

export const createBrand = async (req, res) => {
  try {
    const { name, country, logo_url, category = "both" } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" })
    }
    if (!["car", "motorbike", "both"].includes(category)) {
      return res.status(400).json({ message: "Invalid category" })
    }
    const exists = await Brand.findOne({ where: { name } })
    if (exists) {
      return res.status(409).json({ message: "Brand already exists" })
    }
    let finalLogoUrl = logo_url?.trim() || null
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "brands", resource_type: "image" },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(req.file.buffer)
      })
      finalLogoUrl = uploadResult.secure_url
    }
    const brand = await Brand.create({ name: name.trim(), country: country?.trim(), logo_url: finalLogoUrl, category })
    return res.status(201).json(brand)
  } catch (error) {
    console.error("admin createBrand error:", error)
    return res.status(500).json({ message: "Server error" })
  }
}
