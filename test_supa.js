import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testInsert() {
    const profilePayload = {
        id: crypto.randomUUID(),
        name: 'Test User',
        role: 'worker',
        email: 'test@example.com' // Testing if email column exists
    };

    const { data, error } = await supabase.from('users').insert(profilePayload);
    if (error) {
        console.error("Insert failed:", JSON.stringify(error, null, 2));
    } else {
        console.log("Insert success:", data);
    }
}

testInsert();
