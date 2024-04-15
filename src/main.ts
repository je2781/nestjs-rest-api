import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        noAck: false,
        urls: [`amqp://localhost:5672`],
        queue: "user_message_queue",
        queueOptions: {
          durable: false,
        },
      },
    }
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    })
  );
  app.useStaticAssets(join(__dirname, 'public'));
  app.setBaseViewsDir(join(__dirname, 'views'));
  app.setViewEngine('pug');
  
  await app.startAllMicroservices();
  await app.listen(3333);
}
bootstrap();
