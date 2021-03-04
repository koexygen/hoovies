import {ListItem} from '../site/lists/types/list-item';
import {User} from '@common/core/types/models/User';

export class List {
    id: number;
    name: string;
    description: string;
    style: 'landscape-grid'|'portrait-grid';
    items: ListItem[];
    system: boolean;
    public: boolean;
    user_id: number;
    user?: User;
    items_count?: number;
    updated_at?: string;

    constructor(params: object = {}) {
        for (const name in params) {
            this[name] = params[name];
        }
    }
}
