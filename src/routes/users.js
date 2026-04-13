import { Router } from 'express';
import userRepo from '../repos/userRepository.js'

const router = Router();

router.get('/users', async (req, res) => {
    const users = await userRepo.find();

    res.send(users);
});

router.get('/users/:id', async (req, res) => {
    const { id } = req.params;

    const user = await userRepo.findById(id);

    user ? res.send(user) : res.sendStatus(404);
});

router.post('/users', async (req, res) => {

});

router.put('/users/:id', async (req, res) => {});

router.delete('/users/:id', async (req, res) => {});

export default router;