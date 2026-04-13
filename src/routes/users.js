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
    const { username, bio } = req.body;

    const user = await userRepo.insert(username, bio);

    res.send(user);
});

router.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, bio } = req.body;

    const user = await userRepo.update(id, username, bio);

    user ? res.send(user) : res.sendStatus(404);
});

router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    
    const user = await userRepo.delete(id);

    user ? res.send(user) : res.sendStatus(404);
});

export default router;