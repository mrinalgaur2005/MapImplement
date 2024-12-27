import { createClient } from 'redis';

class FriendDataHandler {
  private redisClient;
  private friendsKeyPrefix = 'userFriends:';

  constructor() {
    this.redisClient = createClient();
    this.redisClient.connect().catch((err) => console.error('Redis connection error:', err));
  }

  async addFriend(username: string, friendId: string): Promise<void> {
    try {
      const userFriendsKey = `${this.friendsKeyPrefix}${username}`;
      const friendFriendsKey = `${this.friendsKeyPrefix}${friendId}`;

      await this.redisClient.sAdd(userFriendsKey, friendId);
      await this.redisClient.sAdd(friendFriendsKey, username);

      console.log(`User ${username} and ${friendId} are now friends`);
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  }

  async removeFriend(username: string, friendId: string): Promise<void> {
    try {
      const userFriendsKey = `${this.friendsKeyPrefix}${username}`;
      const friendFriendsKey = `${this.friendsKeyPrefix}${friendId}`;

      await this.redisClient.sRem(userFriendsKey, friendId);
      await this.redisClient.sRem(friendFriendsKey, username);

      console.log(`User ${username} and ${friendId} are no longer friends`);
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  }

  async getFriends(userId: string): Promise<string[]> {
    try {
      const userFriendsKey = `${this.friendsKeyPrefix}${userId}`;
      const friends = await this.redisClient.sMembers(userFriendsKey);

      return friends;
    } catch (error) {
      console.error('Error getting friends:', error);
      return [];
    }
  }

  async areFriends(username: string, friendId: string): Promise<boolean> {
    try {
      const userFriendsKey = `${this.friendsKeyPrefix}${username}`;
      const isFriend = await this.redisClient.sIsMember(userFriendsKey, friendId);

      return isFriend;
    } catch (error) {
      console.error('Error checking friendship:', error);
      return false;
    }
  }
}

export default FriendDataHandler;
