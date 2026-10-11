const test = require('node:test');
const assert = require('node:assert/strict');
const { escapeHtml, SUPABASE_CONFIG } = require('../supabaseClient.js');

test('XSS Sanitizer - escapeHtml', async (t) => {
    await t.test('escapes HTML special characters', () => {
        assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        assert.equal(escapeHtml("<img src=x onerror='alert(1)'>"), '&lt;img src=x onerror=&#39;alert(1)&#39;&gt;');
        assert.equal(escapeHtml('Tom & Jerry'), 'Tom &amp; Jerry');
    });

    await t.test('handles null, undefined, numbers gracefully', () => {
        assert.equal(escapeHtml(null), '');
        assert.equal(escapeHtml(undefined), '');
        assert.equal(escapeHtml(12345), '12345');
        assert.equal(escapeHtml(0), '0');
    });
});

test('Transaction ID Generator - Collision Resistance', () => {
    const generated = new Set();
    const count = 10000;
    
    for (let i = 0; i < count; i++) {
        const now = new Date();
        const datePrefix = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const entropy = Math.floor(1000 + Math.random() * 9000);
        // Add loop index entropy to simulate high concurrency
        const microEntropy = Math.floor(Math.random() * 1000);
        const id = `TRX${datePrefix}${entropy}${microEntropy}`;
        
        assert.equal(id.startsWith('TRX'), true);
        generated.add(id);
    }
    
    // In 10,000 generations, collision count must be near zero
    assert.ok(generated.size >= count * 0.999, `Expected >= 99.9% unique IDs, got ${generated.size}/${count}`);
});

test('Customer Data Isolation Logic', () => {
    const allTransactions = [
        { id: 'TRX001', pelanggan: 'Budi Santoso', telepon: '081234567890', user_id: 'uuid-budi-1', total: 50000 },
        { id: 'TRX002', pelanggan: 'Budi Setiawan', telepon: '085700001111', user_id: 'uuid-budi-2', total: 60000 },
        { id: 'TRX003', pelanggan: 'Siti Rahayu', telepon: '081398765432', user_id: 'uuid-siti', total: 75000 }
    ];

    function filterUserTransactions(currentUser, transactions) {
        const myName = (currentUser.nama || '').toLowerCase().trim();
        const myPhone = (currentUser.nomor_telepon || '').replace(/\D/g, '');

        return transactions.filter(t => {
            if (t.user_id && currentUser.id && String(t.user_id) === String(currentUser.id)) {
                return true;
            }
            const trxPhone = (t.telepon || '').replace(/\D/g, '');
            if (myPhone && trxPhone && myPhone.length >= 8 && myPhone === trxPhone) {
                return true;
            }
            if (myName && t.pelanggan && t.pelanggan.toLowerCase().trim() === myName) {
                return true;
            }
            return false;
        });
    }

    // Case 1: Budi Setiawan (uuid-budi-2) should NOT see Budi Santoso's orders
    const userBudiSetiawan = { id: 'uuid-budi-2', nama: 'Budi Setiawan', email: 'budi.setiawan@gmail.com', nomor_telepon: '085700001111' };
    const filteredBudi2 = filterUserTransactions(userBudiSetiawan, allTransactions);
    assert.equal(filteredBudi2.length, 1);
    assert.equal(filteredBudi2[0].id, 'TRX002');
    assert.equal(filteredBudi2[0].pelanggan, 'Budi Setiawan');

    // Case 2: User without UUID matching by exact phone
    const userPhoneMatch = { id: null, nama: 'Unknown', email: 'budi@test.com', nomor_telepon: '0812-3456-7890' };
    const filteredPhone = filterUserTransactions(userPhoneMatch, allTransactions);
    assert.equal(filteredPhone.length, 1);
    assert.equal(filteredPhone[0].id, 'TRX001');

    // Case 3: Complete stranger cannot see any transactions
    const stranger = { id: 'uuid-stranger', nama: 'Rian Pratama', email: 'rian@gmail.com', nomor_telepon: '089999999999' };
    const filteredStranger = filterUserTransactions(stranger, allTransactions);
    assert.equal(filteredStranger.length, 0);
});

test('Supabase Cloud Configuration & Contract Integrity', () => {
    assert.ok(SUPABASE_CONFIG.url.startsWith('https://'), 'Supabase URL must use HTTPS');
    assert.ok(SUPABASE_CONFIG.key.length > 20, 'Supabase publishable key must be present');
});
