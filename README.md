# REST API Documentation

## Introduction

This README provides an overview of the REST API architecture and functionalities for the Todo Application.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Security](#security)
4. [Data Storage](#data-storage)

---

## Architecture Overview

The REST API architecture is organized into three main models: user, todo, and task. Users may have multiple todos, and each todo can have multiple tasks, with a task always tied to a parent todo. The API utilizes three controllers: authentication, tasks, and todos, to manage incoming data and direct it to the appropriate logic in the API.

## Security

The API is secured using Passport and JWT (JSON Web Tokens). Users are required to register and log in to access their data, and they can only manage their own todos and tasks. Express-validator is used to validate incoming data for authentication.

## Data Storage

For data storage, the API utilizes Azure Cosmos DB with MongoDB, ensuring a scalable and reliable database solution.

---