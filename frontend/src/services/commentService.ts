import { get, post } from './api';

export interface Comment {
  id: number;
  user_id: number;
  player_id: number;
  order_id: string;
  content: string;
  rating: number;
  created_at: string;
}

export interface CreateCommentRequest {
  player_id: number;
  order_id: string;
  content: string;
  rating: number;
}

// 创建评价
export const createComment = async (data: CreateCommentRequest): Promise<{ success: boolean; id: number }> => {
  return post('/comments', data);
};

// 获取订单的评价
export const getOrderComments = async (orderId: string): Promise<{ success: boolean; comments: Comment[] }> => {
  return get(`/comments/order/${orderId}`);
};

// 获取所有评价
export const getAllComments = async (): Promise<{ success: boolean; comments: Comment[] }> => {
  return get('/comments');
};

// 获取单个评价
export const getCommentById = async (id: number): Promise<{ success: boolean; comment: Comment }> => {
  return get(`/comments/${id}`);
};

// 获取陪玩的所有评价
export const getPlayerComments = async (playerId: number): Promise<{ success: boolean; comments: any[] }> => {
  return get(`/comments/player/${playerId}`);
};