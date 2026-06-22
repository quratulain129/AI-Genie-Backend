const fs = require('fs');
const path = require('path');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads/generated-images');

function getUserImageDir(userId) {
  return path.join(UPLOADS_ROOT, userId);
}

function getImagePath(userId, contentId) {
  return path.join(getUserImageDir(userId), `${contentId}.png`);
}

function ensureUserImageDir(userId) {
  const dir = getUserImageDir(userId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function saveBase64Image(userId, contentId, base64Image) {
  ensureUserImageDir(userId);
  const filePath = getImagePath(userId, contentId);
  const buffer = Buffer.from(base64Image, 'base64');
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

function imageExists(userId, contentId) {
  return fs.existsSync(getImagePath(userId, contentId));
}

function deleteImage(userId, contentId) {
  const filePath = getImagePath(userId, contentId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function deleteUserImages(userId, contentIds) {
  contentIds.forEach((contentId) => deleteImage(userId, contentId));
}

module.exports = {
  getImagePath,
  saveBase64Image,
  imageExists,
  deleteImage,
  deleteUserImages,
};
