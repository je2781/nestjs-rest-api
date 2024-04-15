import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { PrismaService } from "../../src/prisma/prisma.service";
import { UserModule } from "../../src/user/user.module";
import { UserController } from "../../src/user/user.controller";
import { UserService } from "../../src/user/user.service";
import { HttpModule, HttpService } from "@nestjs/axios";
import { MailerModule, MailerService } from "@nestjs-modules/mailer";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CreateUserDto } from "../../src/user/dto";
import { deleteFile } from "../../src/util/file";
import { readFile, readFileSync } from "fs";
import * as path from "path";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { PugAdapter } from "@nestjs-modules/mailer/dist/adapters/pug.adapter";
import { PrismaModule } from "../../src/prisma/prisma.module";
import { Observable } from "rxjs";

describe("UserController (unit)", () => {
  let userService: UserService;
  let userController: UserController;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
    
        PrismaModule,
        ClientsModule.register([
          {
            name: "RMQ_SERVICE",
            transport: Transport.RMQ,
            options: {
              queueOptions: {
                urls: ["amqp://localhost:5672"],
                queue: "user_message_queue",
                durable: false,
              },
            },
          },
        ]),
        HttpModule,
        MailerModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            transport: {
              host: configService.get("MAIL_HOST"),
              port: configService.get("MAIL_PORT"),
              secure: false,
              auth: {
                user: configService.get("MAIL_USER"),
                pass: configService.get("MAIL_PASS"),
              },
            },
            template: {
              dir: __dirname + "../../src/views/template/notification.pug",
              adapter: new PugAdapter({ inlineCssEnabled: true }),
              options: {
                strict: true,
              },
            },
          }),
          inject: [ConfigService],
        }),
      ],
      providers: [UserService],
      controllers: [UserController],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
    userController = moduleRef.get<UserController>(UserController);
  });

  afterAll(async () => {});

  describe("User", () => {
    // describe("Create User", () => {
    //   const dto: CreateUserDto = {
    //     email: "test@test.com",
    //     name: "tester",
    //   };

    //   it("should return observable from emitting a rabbit mq event", async () => {
    //       const observable: Observable = 
    //     jest
    //       .spyOn(userService, "createUser")
    //       .mockResolvedValue(createdUserMock);
    //     const result = await userController.createUser(dto);

    //     expect(result).toBe(createdUserMock);
    //   });
    // });
    describe("Get User", () => {
      it("should return user json object", async () => {
        const userId = 1;
        const user = { id: userId, name: "Test User" };
        jest.spyOn(userService, "getUser").mockResolvedValue(user);

        const result = await userController.getUser(userId);

        expect(result).toBe(user);
      });
      it("should return base64 string of avatar", async () => {
        const socialMediaImg = path.join(
          __dirname,
          "../../dist/public/facebook.png"
        );
        const base64Mock = readFileSync(socialMediaImg).toString("base64");

        jest.spyOn(userService, "getUserAvatar").mockResolvedValue(base64Mock);

        const result = await userController.getUserAvatar(1);
        expect(result).toBe(base64Mock);
      });
    });
    describe("Avatar", () => {
      const mockDeleteFunctionReturn = 'File deleted from file system';

      it("should delete avatar fromm db entry, and file system", async () => {

        jest.spyOn(userService, "deleteUserAvatar").mockResolvedValue(mockDeleteFunctionReturn);

        const result = await userController.deletUserAvatar(1);
        expect(result).toBe(mockDeleteFunctionReturn);
      });
    });
  });
});
