// src/dao/ManagerDAO.ts
import { pool } from '../db';

export interface Manager {
    id: number;
    name: string;
    passwd: string;
    phone_num: string;
    status: boolean;
    authority: number;
    photo_img: string | null;
    created_at: string;
}
export class ManagerDAO {
    static async create(name: string, passwd: string, phone_num: string,
                        authority: number, photo_img?: string): Promise<number> {
        const sql = `INSERT INTO managers (name, passwd, phone_num, status, authority, photo_img)
                 VALUES (?, ?, ?, ?, ?, ?)`;
        const [res]: any = await pool.execute(sql,
            [name, passwd, phone_num, 1, authority, photo_img||null]);
        return res.insertId;
    }
    static async findById(id: number): Promise<Manager|null> {
        const [rows]: any = await pool.execute(`SELECT * FROM managers WHERE id=? LIMIT 1`,[id]);
        return rows[0]||null;
    }
    static async findAll(page=1, pageSize=20): Promise<{total:number, data:Manager[]}> {
        const offset=(page-1)*pageSize;
        const [[{cnt}]]: any = await pool.execute(`SELECT COUNT(*) AS cnt FROM managers`);
        const [rows]: any = await pool.execute(`SELECT * FROM managers
      ORDER BY created_at DESC LIMIT ?,?`,[offset,pageSize]);
        return { total: cnt, data: rows };
    }
    static async updateById(id: number, data: Partial<Pick<Manager,'name'|'phone_num'|'status'|'authority'|'photo_img'>>): Promise<void> {
        const keys=Object.keys(data);
        if(!keys.length) return;
        const set=keys.map(k=>`${k}=?`).join(',');
        const params=keys.map(k=>(data as any)[k]); params.push(id);
        await pool.execute(`UPDATE managers SET ${set} WHERE id=?`,params);
    }
    static async deleteById(id:number):Promise<void>{
        await pool.execute(`DELETE FROM managers WHERE id=?`,[id]);
    }
    static async countAll():Promise<number>{
        const [[{cnt}]]: any = await pool.execute(`SELECT COUNT(*) AS cnt FROM managers`);
        return cnt;
    }
}