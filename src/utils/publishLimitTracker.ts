import { db } from '../lib/firebase';
import { ref, get, set } from 'firebase/database';

interface PublishLimit {
  count: number;
  month: string;
  last_published: string;
}

const LIMIT_PER_MONTH = 10;

export async function checkPublishLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  message: string;
}> {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const limitRef = ref(db, `publish_limits/${userId}`);
    
    const snapshot = await get(limitRef);
    
    if (!snapshot.exists()) {
      // First publish of the month
      return {
        allowed: true,
        remaining: LIMIT_PER_MONTH - 1,
        message: 'First publish of the month'
      };
    }
    
    const data = snapshot.val() as PublishLimit;
    
    // Check if it's a new month
    if (data.month !== currentMonth) {
      // Reset for new month
      return {
        allowed: true,
        remaining: LIMIT_PER_MONTH - 1,
        message: 'New month - limit reset'
      };
    }
    
    // Same month - check count
    if (data.count >= LIMIT_PER_MONTH) {
      return {
        allowed: false,
        remaining: 0,
        message: `Monthly limit of ${LIMIT_PER_MONTH} publishes reached. Try again next month.`
      };
    }
    
    return {
      allowed: true,
      remaining: LIMIT_PER_MONTH - data.count - 1,
      message: `${LIMIT_PER_MONTH - data.count} publishes remaining this month`
    };
  } catch (error) {
    console.error('[PUBLISH LIMIT] Error checking limit:', error);
    throw error;
  }
}

export async function incrementPublishCount(userId: string): Promise<void> {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const limitRef = ref(db, `publish_limits/${userId}`);
    
    const snapshot = await get(limitRef);
    let count = 0;
    
    if (snapshot.exists()) {
      const data = snapshot.val() as PublishLimit;
      if (data.month === currentMonth) {
        count = data.count + 1;
      } else {
        count = 1; // New month, reset count
      }
    } else {
      count = 1; // First publish
    }
    
    await set(limitRef, {
      count,
      month: currentMonth,
      last_published: new Date().toISOString()
    });
    
    console.log(`[PUBLISH LIMIT] Updated count to ${count} for ${currentMonth}`);
  } catch (error) {
    console.error('[PUBLISH LIMIT] Error incrementing count:', error);
    throw error;
  }
}

export async function getRemainingPublishes(userId: string): Promise<number> {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const limitRef = ref(db, `publish_limits/${userId}`);
    
    const snapshot = await get(limitRef);
    
    if (!snapshot.exists()) {
      return LIMIT_PER_MONTH;
    }
    
    const data = snapshot.val() as PublishLimit;
    
    if (data.month !== currentMonth) {
      return LIMIT_PER_MONTH;
    }
    
    return Math.max(0, LIMIT_PER_MONTH - data.count);
  } catch (error) {
    console.error('[PUBLISH LIMIT] Error getting remaining publishes:', error);
    return 0;
  }
}
