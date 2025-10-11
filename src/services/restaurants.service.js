// src/services/restaurants.service.js
const path = require('path');
const { readFileSync } = require('fs');
const Restaurant = require('../models/restaurant.model');

const DATA_PATH = path.join(__dirname, '..', 'data', 'restaurants.json');
const useMemoryStore = process.env.NODE_ENV === 'test' || process.env.USE_MEMORY_STORE === 'true';

function readSeedDataSync() {
  const raw = readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

// async function getNextRestaurantId() {
//   const max = await Restaurant.findOne().sort('-id').select('id').lean();
//   return (max?.id || 0) + 1;
// }

function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }
  
  let memoryStore = clone(readSeedDataSync());
  
  function getFromMemory(predicate) {
    const item = memoryStore.find(predicate);
    return item ? clone(item) : null;
  }
  
  function getNextIdFromMemory() {
    const max = memoryStore.reduce((acc, item) => Math.max(acc, item.id), 0);
    return max + 1;
  }

function getAllRestaurantsSync() {
    if (useMemoryStore) {
        return clone(memoryStore);
      }
  // 동기 데모 전용: 파일에서 즉시 반환
  const data = readSeedDataSync();
  return clone(data);
  
}
//추가
async function getNextRestaurantId() {
    if (useMemoryStore) {
      return getNextIdFromMemory();
    }
    const max = await Restaurant.findOne().sort('-id').select('id').lean();
    return (max?.id || 0) + 1;
  }

async function getAllRestaurants() {
    if (useMemoryStore) {
        return clone(memoryStore);
      }  
  const docs = await Restaurant.find({}).lean();
  return docs;
}

async function getRestaurantById(id) {
  const numericId = Number(id);
  if (useMemoryStore) {
    return getFromMemory((item) => item.id === numericId);
  }
  const doc = await Restaurant.findOne({ id: numericId }).lean();
  return doc || null;
}

async function getPopularRestaurants(limit = 5) {
    if (useMemoryStore) {
        return clone(memoryStore)
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, limit);
      }  
  const docs = await Restaurant.find({}).sort({ rating: -1 }).limit(limit).lean();
  return docs;
}

async function createRestaurant(payload) {
  const requiredFields = ['name', 'category', 'location'];
  const missingField = requiredFields.find((field) => !payload[field]);
  if (missingField) {
    const error = new Error(`'${missingField}' is required`);
    error.statusCode = 400;
    throw error;
  }

  const nextId = await getNextRestaurantId();
  const baseData={
    id: nextId,
    name: payload.name,
    category: payload.category,
    location: payload.location,
    priceRange: payload.priceRange ?? '정보 없음',
    rating: payload.rating ?? 0,
    description: payload.description ?? '',
    recommendedMenu: Array.isArray(payload.recommendedMenu) ? payload.recommendedMenu : [],
    likes: 0,
    image: payload.image ?? ''
  };
  if (useMemoryStore) {
    memoryStore = [...memoryStore, clone(baseData)];
    return clone(baseData);
  }

  const doc = await Restaurant.create(baseData);
  return doc.toObject();
}

 function resetStore() {
    if (useMemoryStore) {
        memoryStore = clone(readSeedDataSync());
        return;
      }
  const seed = readSeedDataSync();
//   await Restaurant.deleteMany({});
//   await Restaurant.insertMany(seed);
return Restaurant.deleteMany({}).then(() => Restaurant.insertMany(seed));
}
// console.log('Restaurant Model type:', typeof Restaurant);
// console.log('Restaurant keys:', Object.keys(Restaurant));
// console.log('Restaurant instanceof mongoose.Model:', Restaurant.prototype instanceof require('mongoose').Model);


async function ensureSeededOnce() {
    if (useMemoryStore) {
        if (memoryStore.length > 0) {
          return { seeded: false, count: memoryStore.length };
        }
        memoryStore = clone(readSeedDataSync());
        return { seeded: true, count: memoryStore.length };
      }
  const count = await Restaurant.estimatedDocumentCount();
  if (count > 0) return { seeded: false, count };
  const seed = readSeedDataSync();
  await Restaurant.insertMany(seed);
  return { seeded: true, count: seed.length };
}

async function updateRestaurant(id, payload) {
  const numericId = Number(id);
  if (useMemoryStore) {
    const index = memoryStore.findIndex((item) => item.id === numericId);
    if (index === -1) return null;
    const updated = {
      ...memoryStore[index],
      name: payload.name ?? memoryStore[index].name,
      category: payload.category ?? memoryStore[index].category,
      location: payload.location ?? memoryStore[index].location,
      priceRange: payload.priceRange ?? memoryStore[index].priceRange,
      rating: payload.rating ?? memoryStore[index].rating,
      description: payload.description ?? memoryStore[index].description,
      recommendedMenu: Array.isArray(payload.recommendedMenu)
        ? payload.recommendedMenu
        : memoryStore[index].recommendedMenu,
      image: payload.image ?? memoryStore[index].image,
    };
    memoryStore = [
      ...memoryStore.slice(0, index),
      clone(updated),
      ...memoryStore.slice(index + 1),
    ];
    return clone(updated);
  }

  const updated = await Restaurant.findOneAndUpdate(
    { id: numericId },
    {
      $set: {
        name: payload.name,
        category: payload.category,
        location: payload.location,
        priceRange: payload.priceRange,
        rating: payload.rating,
        description: payload.description,
        recommendedMenu: Array.isArray(payload.recommendedMenu) ? payload.recommendedMenu : undefined,
        image: payload.image,
      }
    },
    { new: true, runValidators: true, lean: true }
  );
  return updated;
}

async function deleteRestaurant(id) {
  const numericId = Number(id);
  if (useMemoryStore) {
    const index = memoryStore.findIndex((item) => item.id === numericId);
    if (index === -1) return null;
    const [deleted] = memoryStore.splice(index, 1);
    return clone(deleted);
  }
  const deleted = await Restaurant.findOneAndDelete({ id: numericId }).lean();
  return deleted;
}

module.exports = {
  getAllRestaurants,
  getAllRestaurantsSync,
  getRestaurantById,
  getPopularRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  resetStore,
  ensureSeededOnce,
};

