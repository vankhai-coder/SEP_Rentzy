/**
 * @fileoverview Modern BookingReview Model with Enhanced Features
 * @description Comprehensive review system for vehicle bookings with advanced validation,
 *              analytics support, and modern Sequelize patterns
 * @version 2.0.0
 * @author Rentzy Development Team
 */

import { DataTypes, Model, Op } from 'sequelize';
import sequelize from '../config/db.js';

/**
 * @class BookingReview
 * @extends {Model}
 * @description Modern booking review model with comprehensive features
 */
class BookingReview extends Model {
  /**
   * Initialize model associations
   * @param {Object} models - All models for association setup
   */
  static associate(models) {
    // Define associations here when needed
    // this.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
  }

  /**
   * Get review statistics
   * @returns {Promise<Object>} Review analytics data
   */
  static async getReviewStats() {
    const stats = await this.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('review_id')), 'totalReviews'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating >= 4 THEN 1 END')), 'positiveReviews']
      ],
      raw: true
    });
    return stats[0];
  }

  /**
   * Get reviews by rating range
   * @param {number} minRating - Minimum rating filter
   * @param {number} maxRating - Maximum rating filter
   * @returns {Promise<Array>} Filtered reviews
   */
  static async getReviewsByRating(minRating = 1, maxRating = 5) {
    return await this.findAll({
      where: {
         rating: {
           [Op.between]: [minRating, maxRating]
         }
       },
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * Check if review content is appropriate
   * @returns {boolean} Content validation result
   */
  isContentAppropriate() {
    if (!this.review_content) return true;
    
    const inappropriateWords = ['spam', 'fake', 'scam']; // Extend as needed
    const content = this.review_content.toLowerCase();
    
    return !inappropriateWords.some(word => content.includes(word));
  }

  /**
   * Get review sentiment score
   * @returns {string} Sentiment classification
   */
  getSentiment() {
    if (this.rating >= 4) return 'positive';
    if (this.rating === 3) return 'neutral';
    return 'negative';
  }
}

// Initialize the model with modern schema definition
BookingReview.init({
  /**
   * @property {number} review_id - Primary key with auto-increment
   */
  review_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Unique identifier for the review'
  },

  /**
   * @property {number} booking_id - Foreign key to booking table
   */
  booking_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    unique: {
      name: 'unique_booking_review',
      msg: 'Each booking can only have one review'
    },
    validate: {
      notNull: {
        msg: 'Booking ID is required for creating a review'
      },
      isInt: {
        msg: 'Booking ID must be a valid integer'
      }
    },
    comment: 'Reference to the booking being reviewed (1:1 relationship)'
  },

  /**
   * @property {number} rating - Star rating from 1 to 5
   */
  rating: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Rating is required'
      },
      min: {
        args: [1],
        msg: 'Rating must be at least 1 star'
      },
      max: {
        args: [5],
        msg: 'Rating cannot exceed 5 stars'
      },
      isInt: {
        msg: 'Rating must be a whole number'
      }
    },
    comment: 'Star rating from 1 (poor) to 5 (excellent)'
  },

  /**
   * @property {string} review_title - Optional review headline
   */
  review_title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: {
        args: [0, 255],
        msg: 'Review title cannot exceed 255 characters'
      },
      notEmpty: {
        msg: 'Review title cannot be empty if provided'
      }
    },
    comment: 'Optional headline or summary of the review'
  },

  /**
   * @property {string} review_content - Detailed review text
   */
  review_content: {
    type: DataTypes.TEXT('medium'), // Supports up to 16MB
    allowNull: true,
    validate: {
      len: {
        args: [0, 5000],
        msg: 'Review content cannot exceed 5000 characters'
      }
    },
    comment: 'Detailed review content and feedback'
  },

  /**
   * @property {boolean} is_verified - Whether the review is from a verified booking
   */
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Indicates if the review is from a verified completed booking'
  },

  /**
   * @property {boolean} is_featured - Whether the review should be highlighted
   */
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Marks exceptional reviews for featured display'
  },

  /**
   * @property {number} helpfulness_score - Community rating of review usefulness
   */
  helpfulness_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Helpfulness score cannot be negative'
      }
    },
    comment: 'Community-driven score indicating review helpfulness'
  },

  /**
   * @property {Date} created_at - Review creation timestamp
   */
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Timestamp when the review was created'
  },

  /**
   * @property {Date} updated_at - Last modification timestamp
   */
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Timestamp when the review was last updated'
  }
}, {
  sequelize,
  modelName: 'BookingReview',
  tableName: 'booking_reviews',
  timestamps: true, // Enable automatic timestamp management
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  // Modern indexing strategy for optimal performance
  indexes: [
    {
      name: 'idx_booking_reviews_booking_id',
      fields: ['booking_id'],
      unique: true
    },
    {
      name: 'idx_booking_reviews_rating',
      fields: ['rating']
    },
    {
      name: 'idx_booking_reviews_created_at',
      fields: ['created_at']
    },
    {
      name: 'idx_booking_reviews_featured',
      fields: ['is_featured', 'rating'],
      where: { is_featured: true }
    },
    {
      name: 'idx_booking_reviews_helpfulness',
      fields: ['helpfulness_score', 'created_at']
    }
  ],

  // Model-level validations
  validate: {
    /**
     * Ensure review has either title or content
     */
    hasContent() {
      if (!this.review_title && !this.review_content) {
        throw new Error('Review must have either a title or content');
      }
    },

    /**
     * Validate content appropriateness
     */
    appropriateContent() {
      if (!this.isContentAppropriate()) {
        throw new Error('Review content contains inappropriate language');
      }
    }
  },

  // Model hooks for advanced functionality
  hooks: {
    /**
     * Before creating a review, perform additional validations
     */
    beforeCreate: async (review) => {
      // Auto-verify reviews from completed bookings
      review.is_verified = true;
      
      // Auto-feature high-quality reviews
      if (review.rating >= 5 && review.review_content && review.review_content.length > 100) {
        review.is_featured = true;
      }
    },

    /**
     * Before updating, maintain data integrity
     */
    beforeUpdate: async (review) => {
      // Update the updated_at timestamp
      review.updated_at = new Date();
      
      // Re-evaluate featured status
      if (review.rating >= 5 && review.review_content && review.review_content.length > 100) {
        review.is_featured = true;
      } else {
        review.is_featured = false;
      }
    }
  },

  // Default scope for common queries
  defaultScope: {
    order: [['created_at', 'DESC']]
  },

  // Named scopes for specific use cases
  scopes: {
    featured: {
      where: { is_featured: true }
    },
    verified: {
      where: { is_verified: true }
    },
    highRated: {
       where: {
         rating: { [Op.gte]: 4 }
       }
     },
    recent: {
       where: {
         created_at: {
           [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
         }
       }
     }
  }
});

export default BookingReview;