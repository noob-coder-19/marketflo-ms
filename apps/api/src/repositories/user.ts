import { Mongo } from "../clients/mongo";
import type { User } from "../utils/schemas";
import { UserSchema } from "../utils/schemas";

export class UserRepository {
  private static count = 0;
  private static instance: UserRepository | null = null;

  private constructor() {
    const collection = Mongo.getInstance().getCollection("users");

    collection
      .countDocuments()
      .then((count) => {
        UserRepository.count = count;
      })
      .catch((error) => {
        throw new Error(`Failed to count documents: ${error}`);
      });
  }

  public static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }

    return UserRepository.instance;
  }

  public getCount(): number {
    return UserRepository.count;
  }

  public async create(email: string, password: string): Promise<void> {
    const collection = Mongo.getInstance().getCollection("users");
    const user = {
      email,
      password,
      id: `${UserRepository.count + 1}`,
    };

    await collection.insertOne(user);
    UserRepository.count++;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const collection = Mongo.getInstance().getCollection("users");
    const response = await collection.findOne({
      email,
    });

    if (!response) {
      return null;
    }

    const user = UserSchema.parse({
      _id: response._id,
      id: response.id as string,
      email: response.email as string,
      password: response.password as string,
      token: response.token as string,
    });

    return user;
  }

  public async updateToken(email: string, token: string): Promise<void> {
    const collection = Mongo.getInstance().getCollection("users");
    await collection.updateOne(
      {
        email,
      },
      {
        $set: {
          token,
        },
      },
    );
  }
}
