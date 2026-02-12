# Linear Algebra Overview

Linear algebra studies vectors, matrices, linear equations, vector spaces, and linear transformations—the backbone of ML, data science, graphics, and physics.

---

## Vectors

A **vector** is just an ordered list of numbers (e.g., **[3, 5]** in 2D). Key operations: addition, scalar multiplication, and the dot product $$\mathbf{a} \cdot \mathbf{b} = a_1b_1 + \dots + a_nb_n.$$ Use vectors to measure similarity, project onto directions, and power ML models. *Quick calc:* $[1,2]\cdot[3,0]=3$.


---

## Vector Spaces

A **vector space** is any collection of vectors closed under addition/scalar multiplication (think $\mathbb{R}^2$, $\mathbb{R}^3$, polynomial spaces). In $\mathbb{R}^2$, the basis $(1,0)$ and $(0,1)$ generates every $(a,b)$ via $a(1,0)+b(0,1)$.




---

## Cosine Similarity

Cosine similarity measures alignment via $$\cos(\theta)=\frac{\mathbf{a}\cdot\mathbf{b}}{\lVert\mathbf{a}\rVert\lVert\mathbf{b}\rVert}.$$ $1$ means same direction, $0$ orthogonal, $-1$ opposite. *Example:* $[1,2]\cdot[2,1]=4$, both norms are $\sqrt{5}$, so $\cos(\theta)=4/5=0.8$ → strong similarity.

---

## Dot Products (Plain English)

**Dot product recap:** multiply matching coordinates and add the totals: $$\text{dot}(\mathbf{a},\mathbf{b})=a_1b_1+\dots+a_nb_n.$$ Example: $[1,3]\cdot[2,4]=1\cdot2+3\cdot4=14$. Interpretation: positive → same-ish direction, zero → 90°, negative → opposite.

---

## Why Dimensionality Matters for Embeddings

**Why dimensionality matters:** A vector’s length (e.g., 3 numbers → 3D, 768 numbers → 768D) defines how many learned features it can hold. Rich embeddings spread semantics across hundreds of axes, so dot/cosine comparisons capture nuance. pgvector requires equal dimensions—mismatched sizes throw errors. Higher dimension boosts expressiveness but costs storage and can add noise; most text models land between 384–1536. Tips: normalize vectors, document the expected size, and migrate everything together if you switch embedding models.

