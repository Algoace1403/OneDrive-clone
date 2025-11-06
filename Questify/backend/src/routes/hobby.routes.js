import express from 'express';
import { getHobbies, getHobbyById } from '../controllers/hobby.controller.js';

const router = express.Router();

router.get('/', getHobbies);
router.get('/:hobbyId', getHobbyById);

export default router;
