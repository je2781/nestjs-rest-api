---
title: NestServerRestApi
description: nest app
author: Joshua Eze
created:  2024 Apr 14
updated: 2024 Apr 15
---

NestServerRestApi
=========

## development
I started with the prisma schema for mongodb, then moved onto the api design, and finished off with the test suites. 

I also used a rendering template to design a frontend for the email service, __so it sends a template to the recipient__.

## How to run the app

Run (npm run start:dev) from the main directory to compile for development. To test run (npm run test:unit). 

## The Database and relationships

The Prisma ORM was used to translate queries for MongoDB. The models created were users, and avatar