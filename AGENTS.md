# AGENTS Instructions

This document provides instructions for agents contributing to this repository.

## Project Overview

This is a static website built with React and TypeScript that displays a countdown to the end of the month, quarter, half-year, and fiscal year. It also shows the remaining business days, excluding weekends and Japanese holidays.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- pnpm for package management

## Development Workflow

1.  **Install dependencies:**
    ```sh
    pnpm install
    ```
2.  **Start the development server:**

    ```sh
    pnpm run dev
    ```

    The server will be available at `http://localhost:5173` (the port may vary).

3.  **Make your code changes.**

4.  **Verify code style and formatting before committing:**
    ```sh
    pnpm run lint
    pnpm run format:check
    ```
    To automatically fix formatting issues, run:
    ```sh
    pnpm run format
    ```

## Main Scripts

- `pnpm run dev`: Starts the development server.
- `pnpm run build`: Builds the application for production.
- `pnpm run preview`: Previews the production build locally.
- `pnpm run lint`: Lints the code using ESLint.
- `pnpm run format`: Formats the code using Prettier.
- `pnpm run format:check`: Checks the code formatting without making changes.
- `pnpm run deploy`: Deploys the application to GitHub Pages.
