import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { HttpModule } from "@nestjs/axios";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { PugAdapter } from "@nestjs-modules/mailer/dist/adapters/pug.adapter";
import { MailerModule } from "@nestjs-modules/mailer";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  providers: [UserService],
  imports: [
    HttpModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST'),
          port: configService.get('MAIL_PORT'),
          secure: false,
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASS'),
          },
        },
        template: {
          dir: __dirname + "../views/template/notification.pug",
          adapter: new PugAdapter({ inlineCssEnabled: true }),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
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
  ],
  controllers: [UserController],
})
export class UserModule {}
