import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto';
import { MailerService } from '@nestjs-modules/mailer';
import { readFileSync, writeFile } from 'fs';
import * as path from 'path';
import * as pug from 'pug';
import { ClientProxy } from '@nestjs/microservices';
import { deleteFile } from '../util/file';
import { HttpService } from '@nestjs/axios';
import DIR from '../util/path';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private readonly mailService: MailerService,
    @Inject('RMQ_SERVICE') private readonly client: ClientProxy,
    private readonly httpService: HttpService,
  ) {}

  async deleteUserAvatar(userId: number) {
    const avatar = await this.prisma.avatar.findFirst({
      where: {
        reqresUserId: userId,
      },
    });
    //deleting from filesystem and db
    await this.prisma.avatar.delete({
      where: {
        reqresUserId: userId,
      },
    });

    return deleteFile(avatar.path);
  }

  async getUser(userId: number) {
    try {
      const res = await this.httpService.axiosRef.get(
        `https://reqres.in/api/users/${userId}`,
      );

      return res.data['data'];
    } catch (err) {
      return {
        message: "user account doesn't exist",
      };
    }
  }

  async getUserAvatar(userId: number) {
    try {
      const avatar = await this.prisma.avatar.findFirst({
        where: {
          reqresUserId: userId,
        },
      });
      //checking avatar has already been saved to db and file system
      if (!avatar) {
        //creating avatar entry with reqres userId
        await this.prisma.avatar.create({
          data: {
            reqresUserId: userId,
            path: '',
          },
        });

        const res = await this.httpService.axiosRef.get(
          `https://reqres.in/api/users/${userId}`,
        );

        const avatarUrl = res.data['data']['avatar'];

        const response = await this.httpService.axiosRef.get(avatarUrl, {
          responseType: 'arraybuffer',
        });
        const buffer64 = Buffer.from(response.data, 'binary').toString(
          'base64',
        );
        const pth = path.join(__dirname, `../public/avatar-${userId}_b64.png`);

        writeFile(pth, buffer64, (err: any) => {
          console.log(err);
        });

        //saving path of encoded image to db
        await this.prisma.avatar.update({
          where: {
            reqresUserId: userId,
          },
          data: {
            path: `/public/avatar-${userId}_b64.png`,
          },
        });

        return buffer64;
      } else {
        return readFileSync(path.join(DIR, avatar.path)).toString('base64');
      }
    } catch (err) {
      return {
        message: "user account doesn't exist",
      };
    }
  }

  async createUser(dto: CreateUserDto) {
    try {
      const res = await this.httpService.axiosRef.post(
        `https://reqres.in/api/users`,
        {
          ...dto,
        },
      );

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
        },
      });

      //preparing email template and its data
      const templateFile = path.join(
        __dirname,
        '../views/template/notification.pug',
      );
      const socialMediaImg = path.join(__dirname, '../public/facebook.png');
      const imageDataSocialMedia =
        readFileSync(socialMediaImg).toString('base64');

      const pugData = {
        title: dto.name,
        description:
          'This is to inform you that we have received you credentials',
        imgSocial: imageDataSocialMedia,
        year: '2024',
      };

      const render = this._bodytemplete(templateFile, pugData);
      await this._processSendEmail(dto.email, render);

      //publishing event to queue in RabbitMQ
      this._publish(user);

      return res.data;
    } catch (err) {
      throw err;
    }
  }

  async _publish(user: User) {
    this.client.emit<User>('user_created', { ...user });
  }

  _bodytemplete(template: string, data: any) {
    return pug.renderFile(template, { data });
  }

  async _processSendEmail(to: string, body: any): Promise<void> {
    await this.mailService
      .sendMail({
        to: to,
        from: 'sender@yourdomain.com',
        subject: 'User Created!',
        html: body,
      })
      .then(() => {
        console.log('Email sent');
      })
      .catch((e) => {
        console.log('Error sending email', e);
      });
  }
}
