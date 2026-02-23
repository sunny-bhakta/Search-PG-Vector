# Search-PG-Vector

A simple project demonstrating semantic search using PostgreSQL with the pgvector extension.

## Getting Started

1. **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/Search-PG-Vector.git
    cd Search-PG-Vector
    ```

2. **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3. **Configure your database:**
    - Ensure PostgreSQL is running with the `pgvector` extension enabled.
    - Update the `.env` file with your database credentials.

4. **Run the project:**
    ```bash
    npm start
    # or
    yarn start
    ```
    ## Supported Endpoints

    ### Search Endpoint

    `GET /api/search`

    #### Query Parameters

    - `q` (string): Search query (e.g., `jeans`).
    - `filters` (string): Comma-separated filters.  
        - Examples:  
            - `brand:puma`
            - `minPrice:50`
            - `maxPrice:150`
            - `tags:denim|slim` (multiple tags with OR logic)
            - `category:sneakers`
            - `category_paths:clothing/footwear/sneakers`
            - Combine filters: `category:sneakers,brand:nike`
            - Multiple category paths (OR logic): `category_paths:clothing/footwear/sneakers|clothing/footwear/boots`
    - `page` (number): Page number for pagination (e.g., `2`).
    - `limit` (number): Number of results per page (e.g., `10`).
    - `sort` (string): Sorting field and order.  
        - Examples:  
            - `price:asc`
            - `blended_score:desc`

    #### Example Requests

    ```http
    GET http://localhost:3000/api/search?q=jeans&filters=brand:puma,minPrice:50,maxPrice:150,tags:denim|slim
    GET http://localhost:3000/api/search?q=shoes&filters=category:sneakers
    GET http://localhost:3000/api/search?q=shoes&filters=category_paths:clothing/footwear/sneakers
    GET http://localhost:3000/api/search?q=shoes&filters=category:sneakers,brand:nike
    GET http://localhost:3000/api/search?q=shoes&filters=category_paths:clothing/footwear/sneakers|clothing/footwear/boots
    GET http://localhost:3000/api/search?q=jeans&page=2&limit=10&sort=price:asc
    ```
 
5. **Reference docs:** 
    - [Basic](docs/concepts.md)
    - [Implementaion Flow](docs/topics.md)

 
