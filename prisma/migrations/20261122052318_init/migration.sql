-- CreateTable
CREATE TABLE "Users" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Sessions" (
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expire_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_user_id_key" ON "Users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sessions_session_id_key" ON "Sessions"("session_id");

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
