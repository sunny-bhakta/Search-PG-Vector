const encodeText = require("./embed");
const db = require("../data/db");

const input = [
    {
        id: "2c1e5d51-4c9b-4b7c-8b7d-6d97d2c90111",
        title: "AirFlex Jogger",
        description: "Tapered jogger with breathable four-way stretch fabric for everyday wear.",
        tags: ["athleisure", "mens"],
        metadata: { material: "cotton", color: "black" }
    },
    {
        id: "8a9fa5ec-9b55-44f9-b1a6-1cfefe076d5c",
        title: "TrailLite Sneaker",
        description: "Lightweight trail-running sneaker with Vibram outsole traction.",
        tags: ["footwear", "outdoors"],
        metadata: { waterproof: true, color: "olive" }
    },
    {
        id: "a3e3d286-9d35-43fd-934f-68e442a7dad2",
        title: "CloudRide Running Tee",
        description: "Moisture-wicking running tee with bonded seams to reduce chafing.",
        tags: ["tops", "running"],
        metadata: { material: "polyester", fit: "regular" }
    },
    {
        id: "c4f7af85-6cc8-4c54-8b23-9e4e2bc9c5f2",
        title: "Summit Shell Jacket",
        description: "3-layer waterproof shell with adjustable hood and pit zips.",
        tags: ["outerwear", "unisex"],
        metadata: { waterproof: true, color: "navy" }
    },
    {
        id: "1f8a346c-2030-4fa3-8d77-43c9777083e5",
        title: "Everyday Oxford Shirt",
        description: "Classic oxford button-down with wrinkle-resistant cotton blend.",
        tags: ["mens", "office"],
        metadata: { sleeve: "long", color: "white" }
    },
    {
        id: "b7ad4f59-457f-4d0b-86f2-f0f5e7c08e8d",
        title: "Lumen Yoga Mat",
        description: "5mm natural rubber yoga mat with anti-slip texture.",
        tags: ["fitness", "gear"],
        metadata: { thickness_mm: 5, color: "sage" }
    },
    {
        id: "f63a60da-1f54-44df-81ec-2f50fb7912dd",
        title: "CozyWool Cardigan",
        description: "Merino wool cardigan with shawl collar and deep pockets.",
        tags: ["womens", "knitwear"],
        metadata: { material: "merino", color: "charcoal" }
    },
    {
        id: "3ced0e9e-405f-4ed9-a19e-8ce73e552f5e",
        title: "Metro Commuter Backpack",
        description: "20L commuter backpack with padded laptop sleeve and trolley pass-through.",
        tags: ["bags", "commuter"],
        metadata: { capacity_l: 20, waterproof: false }
    },
    {
        id: "91c179d3-942b-4d9d-89a0-c9df7c402ecb",
        title: "Pulse Wireless Earbuds",
        description: "Active-noise-cancelling earbuds with 8-hour battery life.",
        tags: ["electronics", "audio"],
        metadata: { waterproof: false, color: "matte black" }
    },
    {
        id: "5e1a1952-7a12-4c42-9fb0-cee4cfaaad0a",
        title: "FoamRide Recovery Slides",
        description: "Dual-density foam slides that reduce pressure post-workout.",
        tags: ["footwear", "recovery"],
        metadata: { color: "stone", gender: "unisex" }
    }
];

async function seeEmbeddings() {
    for (const item of input) {
        const text = `${item.title} ${item.description}`.toLowerCase();
        item.embedding = await encodeText(text);
        console.log(`embedded ${item.id}`, item.embedding.length);
    }
}

function buildInsertStatement(product) {
    return {
        text: `
            INSERT INTO cproducts (id, title, description, tags, embedding, metadata)
            VALUES ($1, $2, $3, $4, $5::vector, $6)
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                tags = EXCLUDED.tags,
                embedding = EXCLUDED.embedding,
                metadata = EXCLUDED.metadata;
        `,
        values: [
            product.id,
            product.title,
            product.description,
            product.tags,
            db.toVector(product.embedding),
            product.metadata
        ]
    };
}

function printInsertQueries() {
    for (const product of input) {
        if (!product.embedding) {
            console.warn(`Skipping ${product.id} (missing embedding)`);
            continue;
        }
        const stmt = buildInsertStatement(product);
        console.log('\n-- Insert/Upsert');
        console.log(stmt.text.trim());
        console.log('VALUES =>', JSON.stringify(stmt.values));
    }
}

async function insertAll() {
    for (const product of input) {
        if (!product.embedding) continue;
        const stmt = buildInsertStatement(product);
        await db.query(stmt.text, stmt.values);
    }
}

// Generate embeddings then print ready-to-run SQL commands
seeEmbeddings()
    .then(() => {
        printInsertQueries();
        return insertAll(); // Uncomment to insert directly into cproducts
    })
    .catch((err) => {
        console.error('Embedding generation failed', err);
    });

module.exports = {
    JSON_INPUT: input,
    buildInsertStatement,
    printInsertQueries,
    insertAll
};