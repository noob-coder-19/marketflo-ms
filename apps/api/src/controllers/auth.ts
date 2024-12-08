import type { Request, Response } from "express";
import { fromError } from "zod-validation-error";
import { hash } from "argon2";
import { LoginRequestSchema, SignUpRequestSchema } from "../utils/schemas";
import { UserRepository } from "../repositories/user";

export const loginController = (req: Request, res: Response): void => {
  (async () => {
    const parsedRequest = LoginRequestSchema.safeParse(req.body);

    if (!parsedRequest.success) {
      const error = fromError(parsedRequest.error);
      res.status(422).send(error.message);
      return;
    }

    const requestData = parsedRequest.data;
  })().catch((error) => {
    console.error(error);
    res.status(500).send("An error occurred");
  });
};

export const registerController = (req: Request, res: Response): void => {
  (async () => {
    const parsedRequest = SignUpRequestSchema.safeParse(req.body);

    if (!parsedRequest.success) {
      const error = fromError(parsedRequest.error);
      res.status(422).send(error.message);
      return;
    }

    const requestData = parsedRequest.data;

    // Check if user already exists
    const user = await UserRepository.getInstance().findByEmail(
      requestData.email,
    );

    if (user) {
      res.status(400).send("User already exists");
      return;
    }

    // timeCost, parallelism and memoryCost configured according to OWASP recommendations: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
    const hashedPass = await hash(requestData.password, {
      timeCost: 2,
      parallelism: 1,
      memoryCost: 19456, // 19 MiB
    });

    try {
      // Do something with the data
      await UserRepository.getInstance().create(requestData.email, hashedPass);

      res.status(200).send("User registered successfully");
    } catch (error) {
      res.status(500).send(error);
    }
  })().catch((error) => {
    res.status(500).send(error);
  });
};
