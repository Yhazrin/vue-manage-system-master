import { defineStore } from 'pinia';

interface ObjectList {
    [key: string]: string[];
}

export const usePermissStore = defineStore('permiss', {
    state: () => {
        const defaultList: ObjectList = {
            admin: [/* 管理员权限列表 */],
            user: [/* 普通用户权限列表 */],
            companion: [/* 陪玩师权限列表 */]
        };
        const role = localStorage.getItem('role');
        return {
            key: defaultList[role as keyof ObjectList] || defaultList.user,
            defaultList,
        };
    },
    actions: {
        handleSet(val: string[]) {
            this.key = val;
        },
    },
});
