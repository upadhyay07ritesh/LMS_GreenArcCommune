import { body } from 'express-validator';

export const userSignupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('aadharNumber')
    .optional()
    .matches(/^[0-9]{12}$/)
    .withMessage('Aadhar number must be exactly 12 digits'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be one of: male, female, other'),
  body('paymentStatus')
    .optional()
    .isIn(['paid', 'demo'])
    .withMessage('Payment status must be either "paid" or "Demo"')
];

export const adminCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('aadharNumber')
    .optional()
    .matches(/^[0-9]{12}$/)
    .withMessage('Aadhar number must be exactly 12 digits'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be one of: male, female, other'),
  body('paymentStatus')
    .optional()
    .isIn(['paid', 'demo'])
    .withMessage('Payment status must be either "paid" or "Demo"')
];

export const studentCreateValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('course').notEmpty().withMessage('Course is required'),
  body('aadharNumber')
    .optional()
    .matches(/^[0-9]{12}$/)
    .withMessage('Aadhar number must be exactly 12 digits'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be one of: male, female, other'),
  body('paymentStatus')
    .optional()
    .isIn(['paid', 'demo'])
    .withMessage('Payment status must be either "paid" or "Demo"')
];

export const userUpdateValidation = [
  body('aadharNumber')
    .optional()
    .matches(/^[0-9]{12}$/)
    .withMessage('Aadhar number must be exactly 12 digits'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be one of: male, female, other'),
  body('paymentStatus')
    .optional()
    .isIn(['paid', 'demo'])
    .withMessage('Payment status must be either "paid" or "Demo"')
];
