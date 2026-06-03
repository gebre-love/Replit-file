import { Router } from "express";
import { getBotState } from "./bot-state";

const router = Router();

router.get("/status", (_req, res) => {
  res.json(getBotState());
});

export default router;
