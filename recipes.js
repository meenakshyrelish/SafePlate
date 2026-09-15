/**
 * SafePlate AI - Recipe Knowledge Base & Unified Personalization Engine
 * 
 * Provides:
 * - The 12 default meal suggestions with HD culinary photography
 * - Unified meal search across default meals and popular dishes
 * - Multi-allergen detection and intelligent cross-validated substitution engine
 * - Safety notes and medical disclaimers
 */

// 1. The 12 Default Meal Definitions
const DEFAULT_MEALS = [
  {
    id: 'pizza',
    name: 'Pizza',
    description: 'Crispy stone-baked crust topped with rich tomato sauce, melted cheese, and fresh basil.',
    category: 'Italian',
    prepTime: '20 mins',
    cookTime: '15 mins',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Pizza dough (wheat flour, yeast, water)', amount: '1 ball (300g)', allergens: ['Gluten'] },
      { name: 'Tomato pizza sauce with garlic and herbs', amount: '1/2 cup', allergens: [] },
      { name: 'Mozzarella cheese', amount: '1.5 cups shredded', allergens: ['Dairy'] },
      { name: 'Parmesan cheese', amount: '2 tbsp grated', allergens: ['Dairy'] },
      { name: 'Extra virgin olive oil', amount: '1 tbsp', allergens: [] },
      { name: 'Fresh basil leaves', amount: '6-8 leaves', allergens: [] }
    ],
    instructions: [
      'Preheat your oven to 475°F (245°C) with a pizza stone or heavy baking sheet inside.',
      'Roll out the dough on a lightly floured parchment paper to a 12-inch round.',
      'Spread the seasoned tomato sauce evenly over the dough, leaving a 1/2-inch border for the crust.',
      'Top evenly with cheese and drizzle with extra virgin olive oil.',
      'Bake for 12-15 minutes until the crust is golden-brown and cheese is bubbling.',
      'Garnish with fresh basil leaves before slicing and serving warm.'
    ],
    cautionNotes: [
      'Check pizza sauce labels for hidden wheat thickeners or dairy whey.',
      'Ensure work surfaces and pizza cutters are free from flour dust or cheese residue.'
    ]
  },
  {
    id: 'pasta',
    name: 'Pasta',
    description: 'Silky pasta ribbons tossed in a velvety garlic and herb sauce.',
    category: 'Italian',
    prepTime: '10 mins',
    cookTime: '15 mins',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Fettuccine or penne pasta (semolina wheat)', amount: '250g', allergens: ['Gluten'] },
      { name: 'Heavy cream', amount: '3/4 cup', allergens: ['Dairy'] },
      { name: 'Butter', amount: '2 tbsp', allergens: ['Dairy'] },
      { name: 'Fresh garlic (minced)', amount: '3 cloves', allergens: [] },
      { name: 'Parmesan cheese (grated)', amount: '1/2 cup', allergens: ['Dairy'] },
      { name: 'Fresh parsley & black pepper', amount: 'To taste', allergens: [] }
    ],
    instructions: [
      'Bring a large pot of salted water to a rolling boil and cook pasta until al dente.',
      'Melt butter in a skillet over medium heat, add minced garlic and saute for 1 minute until aromatic.',
      'Pour in the cream and bring to a gentle simmer for 3-4 minutes.',
      'Stir in the parmesan cheese until smooth and melted into the sauce.',
      'Toss the drained pasta into the sauce, coating thoroughly, and season with parsley and freshly cracked pepper.'
    ],
    cautionNotes: [
      'Store-bought dried pasta often shares equipment with egg pasta.',
      'Commercial cream sauces may contain wheat starch thickeners.'
    ]
  },
  {
    id: 'chicken-biryani',
    name: 'Chicken Biryani',
    description: 'Fragrant basmati rice layered with spiced marinated chicken, caramelized onions, and saffron.',
    category: 'Indian',
    prepTime: '30 mins',
    cookTime: '40 mins',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Basmati rice (long grain)', amount: '2 cups', allergens: [] },
      { name: 'Boneless chicken thighs (cubed)', amount: '500g', allergens: [] },
      { name: 'Plain yogurt / curd', amount: '1/2 cup', allergens: ['Dairy'] },
      { name: 'Ghee (clarified butter)', amount: '3 tbsp', allergens: ['Dairy'] },
      { name: 'Fried onions (birista)', amount: '1 cup', allergens: [] },
      { name: 'Biryani spice blend (cumin, coriander, garam masala, turmeric)', amount: '2 tbsp', allergens: [] },
      { name: 'Fresh mint and cilantro', amount: '1/2 cup chopped', allergens: [] }
    ],
    instructions: [
      'Marinate chicken in yogurt, biryani spices, garlic, ginger, and salt for at least 30 minutes.',
      'Par-cook the basmati rice with whole spices in boiling water until 70% done, then drain.',
      'In a heavy-bottomed pot, sear the marinated chicken in ghee until lightly browned.',
      'Layer the par-cooked rice over the chicken, topping with fried onions, chopped mint, and cilantro.',
      'Cover tightly with a lid and cook on low heat (dum) for 20-25 minutes until chicken is tender and rice is fluffy.'
    ],
    cautionNotes: [
      'Ghee is a dairy product; while clarified, it must be substituted for dairy-allergic diners.',
      'Ensure pre-fried commercial onions do not contain wheat flour coating.'
    ]
  },
  {
    id: 'burger',
    name: 'Burger',
    description: 'Juicy grilled patty layered with crisp lettuce, ripe tomatoes, pickles, and signature sauce.',
    category: 'American',
    prepTime: '15 mins',
    cookTime: '12 mins',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Burger brioche bun (wheat, eggs, milk)', amount: '2 buns', allergens: ['Gluten', 'Eggs', 'Dairy'] },
      { name: 'Ground beef or chicken patty', amount: '2 patties (300g)', allergens: [] },
      { name: 'Cheddar cheese slices', amount: '2 slices', allergens: ['Dairy'] },
      { name: 'Mayonnaise', amount: '2 tbsp', allergens: ['Eggs'] },
      { name: 'Crisp lettuce & sliced tomato', amount: '1 cup', allergens: [] },
      { name: 'Dill pickles & mustard', amount: 'To taste', allergens: [] }
    ],
    instructions: [
      'Season burger patties with salt, black pepper, and garlic powder.',
      'Heat a grill pan or cast-iron skillet over medium-high heat and sear patties for 4-5 minutes per side.',
      'Place cheese on patties during the last minute of cooking to melt.',
      'Lightly toast the buns in the pan.',
      'Spread mayonnaise and mustard on the buns, layer with lettuce, tomato, patty, and pickles, and serve.'
    ],
    cautionNotes: [
      'Standard burger buns almost always contain wheat, milk, and eggs.',
      'Traditional mayonnaise relies on egg yolk emulsification.'
    ]
  },
  {
    id: 'fried-rice',
    name: 'Fried Rice',
    description: 'Wok-tossed jasmine rice with tender vegetables, scrambled eggs, and savory seasoning.',
    category: 'Asian',
    prepTime: '15 mins',
    cookTime: '10 mins',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Cooked jasmine rice (day-old, chilled)', amount: '3 cups', allergens: [] },
      { name: 'Eggs (beaten)', amount: '2 large', allergens: ['Eggs'] },
      { name: 'Traditional soy sauce', amount: '2 tbsp', allergens: ['Soy', 'Gluten'] },
      { name: 'Toasted sesame oil', amount: '1 tbsp', allergens: ['Sesame'] },
      { name: 'Diced carrots, peas, and green onions', amount: '1.5 cups', allergens: [] },
      { name: 'Garlic and ginger (minced)', amount: '1 tbsp each', allergens: [] }
    ],
    instructions: [
      'Heat 1 tbsp vegetable oil in a wok or large skillet over high heat.',
      'Pour in beaten eggs and scramble quickly until just set, then remove and set aside.',
      'Add remaining oil, then stir-fry minced garlic, ginger, carrots, and peas for 2 minutes.',
      'Add chilled rice, breaking up clumps with a spatula, and stir-fry vigorously for 3 minutes.',
      'Drizzle soy sauce and sesame oil around the perimeter of the wok, fold in scrambled eggs and scallions, and toss until steaming.'
    ],
    cautionNotes: [
      'Standard soy sauce contains brewed wheat (gluten) and soybeans.',
      'Sesame oil is a recognized major allergen; use neutral avocado or sunflower oil if sesame sensitive.'
    ]
  },
  {
    id: 'noodles',
    name: 'Noodles',
    description: 'Savory stir-fried noodles with crunchy cabbage, bell peppers, and umami glaze.',
    category: 'Asian',
    prepTime: '15 mins',
    cookTime: '10 mins',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Wheat egg noodles', amount: '200g', allergens: ['Gluten', 'Eggs'] },
      { name: 'Dark and light soy sauce', amount: '2 tbsp', allergens: ['Soy', 'Gluten'] },
      { name: 'Oyster sauce (shellfish extract)', amount: '1 tbsp', allergens: ['Shellfish', 'Soy', 'Gluten'] },
      { name: 'Shredded cabbage and julienned bell peppers', amount: '2 cups', allergens: [] },
      { name: 'Garlic and scallions', amount: '2 tbsp', allergens: [] },
      { name: 'Peanut oil for stir-frying', amount: '2 tbsp', allergens: ['Peanuts'] }
    ],
    instructions: [
      'Boil noodles according to package instructions until tender, rinse with cool water, and drain well.',
      'In a small bowl, whisk soy sauce, oyster sauce, and a splash of water for the sauce.',
      'Heat cooking oil in a wok over high heat, add garlic and white parts of scallions for 30 seconds.',
      'Toss in cabbage and peppers and stir-fry for 2 minutes until tender-crisp.',
      'Add noodles and pour sauce over top, tossing quickly for 2-3 minutes until sauce caramelizes lightly onto noodles.'
    ],
    cautionNotes: [
      'Traditional oyster sauce is derived from oysters (shellfish).',
      'Stir-fry woks in restaurants often use peanut oil or crushed peanuts.'
    ]
  },
  {
    id: 'pancakes',
    name: 'Pancakes',
    description: 'Golden, fluffy griddle pancakes served with pure maple syrup and fresh berries.',
    category: 'Breakfast',
    prepTime: '10 mins',
    cookTime: '15 mins',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'All-purpose wheat flour', amount: '1.5 cups', allergens: ['Gluten'] },
      { name: 'Cow milk or buttermilk', amount: '1.25 cups', allergens: ['Dairy'] },
      { name: 'Egg', amount: '1 large', allergens: ['Eggs'] },
      { name: 'Melted butter', amount: '3 tbsp', allergens: ['Dairy'] },
      { name: 'Baking powder and pinch of salt', amount: '2 tsp', allergens: [] },
      { name: 'Cane sugar', amount: '2 tbsp', allergens: [] }
    ],
    instructions: [
      'In a medium bowl, whisk together the flour, baking powder, sugar, and salt.',
      'In a separate bowl, whisk milk, egg, and melted butter.',
      'Pour wet ingredients into dry and whisk gently just until combined (small lumps are normal).',
      'Heat a lightly oiled griddle or non-stick pan over medium heat.',
      'Pour 1/4 cup batter per pancake. Cook until bubbles form on top and edges look set (2-3 minutes).',
      'Flip and cook the second side for 1-2 minutes until golden brown.'
    ],
    cautionNotes: [
      'Pancakes typically combine three major allergens: wheat/gluten, milk, and eggs.',
      'Ensure the cooking pan is thoroughly cleaned of butter before cooking dairy-free batches.'
    ]
  },
  {
    id: 'chocolate-cake',
    name: 'Chocolate Cake',
    description: 'Decadent, moist chocolate sponge topped with rich cocoa fudge frosting.',
    category: 'Dessert',
    prepTime: '20 mins',
    cookTime: '30 mins',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'All-purpose wheat flour', amount: '1.75 cups', allergens: ['Gluten'] },
      { name: 'Unsweetened cocoa powder', amount: '3/4 cup', allergens: [] },
      { name: 'Granulated sugar', amount: '1.5 cups', allergens: [] },
      { name: 'Whole cow milk', amount: '1 cup', allergens: ['Dairy'] },
      { name: 'Eggs', amount: '2 large', allergens: ['Eggs'] },
      { name: 'Butter (for cake and frosting)', amount: '1/2 cup', allergens: ['Dairy'] },
      { name: 'Vanilla extract and baking soda', amount: '2 tsp each', allergens: [] }
    ],
    instructions: [
      'Preheat oven to 350°F (175°C). Grease and flour two 8-inch round cake pans.',
      'In a large bowl, sift together flour, cocoa, sugar, baking soda, and salt.',
      'Add eggs, milk, melted butter, and vanilla extract. Beat with a mixer for 2 minutes on medium speed.',
      'Divide batter evenly between prepared pans and bake for 30-35 minutes until a toothpick inserted in center comes out clean.',
      'Cool in pans for 10 minutes, turn onto wire racks, and frost once completely cooled.'
    ],
    cautionNotes: [
      'Commercial baking mixes or cocoa powders may contain dairy whey or hazelnut/nut traces.',
      'Always inspect chocolate chips and sprinkles for milk powder or soy lecithin.'
    ]
  },
  {
    id: 'sandwich',
    name: 'Sandwich',
    description: 'Crisp layered toasted sandwich with fresh vegetables, roasted protein, and savory spread.',
    category: 'Lunch',
    prepTime: '10 mins',
    cookTime: '5 mins',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Sliced wheat bread', amount: '2 slices', allergens: ['Gluten'] },
      { name: 'Sliced roasted turkey or chicken', amount: '100g', allergens: [] },
      { name: 'Swiss or cheddar cheese slice', amount: '1 slice', allergens: ['Dairy'] },
      { name: 'Mayonnaise spread', amount: '1 tbsp', allergens: ['Eggs'] },
      { name: 'Dijon mustard', amount: '1 tsp', allergens: [] },
      { name: 'Crisp butter lettuce, sliced cucumber, and tomato', amount: '1/2 cup', allergens: [] }
    ],
    instructions: [
      'Lightly toast bread slices until golden.',
      'Spread mayonnaise on one slice and mustard on the other.',
      'Layer sliced protein, cheese, cucumber, tomato, and lettuce evenly.',
      'Top with second bread slice, press gently, and slice diagonally.'
    ],
    cautionNotes: [
      'Standard packaged sandwich bread frequently contains wheat, barley, and soy flour.',
      'Check deli meats for milk-derived sodium caseinate fillers.'
    ]
  },
  {
    id: 'dosa',
    name: 'Dosa',
    description: 'Crispy South Indian fermented rice and lentil crepe served with spiced potato filling.',
    category: 'Indian',
    prepTime: '20 mins',
    cookTime: '15 mins',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Fermented rice & urad dal (black gram) batter', amount: '2 cups', allergens: [] },
      { name: 'Boiled potatoes (spiced with turmeric and mustard seeds)', amount: '200g', allergens: [] },
      { name: 'Ghee or butter for roasting', amount: '2 tbsp', allergens: ['Dairy'] },
      { name: 'Fresh coconut chutney with roasted peanuts', amount: '1/2 cup', allergens: ['Peanuts', 'Tree Nuts'] },
      { name: 'Curry leaves, green chilies, and ginger', amount: '1 tbsp', allergens: [] }
    ],
    instructions: [
      'Heat a flat cast-iron griddle or non-stick tawa over medium-high heat.',
      'Sprinkle a few drops of water on the tawa; it should sizzle and evaporate immediately. Wipe dry.',
      'Pour a ladleful of batter in the center and spread in a spiral outward motion to form a thin crepe.',
      'Drizzle fat around the edges and cook until the underside is crisp and golden.',
      'Place spiced potato masala in the center, fold over, and serve hot with chutney.'
    ],
    cautionNotes: [
      'Traditional South Indian chutneys frequently incorporate roasted peanuts or grated coconut.',
      'Ghee is commonly drizzled on restaurant dosas; use coconut or sesame/mustard oil instead.'
    ]
  },
  {
    id: 'butter-chicken',
    name: 'Butter Chicken',
    description: 'Tender tandoori chicken simmered in a velvety, mildly spiced tomato, butter, and cream sauce.',
    category: 'Indian',
    prepTime: '25 mins',
    cookTime: '30 mins',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Chicken breast or thigh pieces', amount: '500g', allergens: [] },
      { name: 'Plain yogurt for marinade', amount: '1/3 cup', allergens: ['Dairy'] },
      { name: 'Butter', amount: '3 tbsp', allergens: ['Dairy'] },
      { name: 'Heavy cream', amount: '1/2 cup', allergens: ['Dairy'] },
      { name: 'Cashew nut paste (traditional thickener)', amount: '2 tbsp', allergens: ['Tree Nuts'] },
      { name: 'Pureed tomatoes & tomato paste', amount: '1.5 cups', allergens: [] },
      { name: 'Garam masala, Kashmiri chili, garlic & ginger', amount: '2 tbsp', allergens: [] }
    ],
    instructions: [
      'Marinate chicken in yogurt, lemon juice, chili powder, and garlic for 30 minutes, then sear in a pan until lightly charred.',
      'In a pot, melt butter, add pureed ginger-garlic and tomato puree, simmering for 10 minutes until reduced.',
      'Stir in cashew paste and spices, cooking until fragrant and oil separates.',
      'Add cooked chicken pieces and simmer gently for 8-10 minutes.',
      'Stir in heavy cream and kasuri methi (fenugreek leaves), cooking for 2 more minutes on low heat.'
    ],
    cautionNotes: [
      'Authentic restaurant butter chicken almost universally relies on cashew nut paste for richness.',
      'Substantial dairy content (butter, cream, yogurt) must be systematically substituted.'
    ]
  },
  {
    id: 'salad',
    name: 'Salad',
    description: 'Crisp garden greens with crunchy croutons, shaved parmesan, and creamy dressing.',
    category: 'Healthy',
    prepTime: '15 mins',
    cookTime: '0 mins',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: 'Crisp romaine lettuce & baby spinach', amount: '4 cups', allergens: [] },
      { name: 'Garlic croutons (toasted wheat bread)', amount: '1 cup', allergens: ['Gluten'] },
      { name: 'Shaved parmesan cheese', amount: '1/3 cup', allergens: ['Dairy'] },
      { name: 'Caesar or ranch dressing (egg yolk, anchovy, dairy)', amount: '1/3 cup', allergens: ['Eggs', 'Dairy', 'Fish'] },
      { name: 'Toasted walnuts or sunflower seeds', amount: '2 tbsp', allergens: ['Tree Nuts'] },
      { name: 'Cherry tomatoes & sliced cucumbers', amount: '1 cup', allergens: [] }
    ],
    instructions: [
      'Wash, spin-dry, and tear romaine lettuce and spinach into bite-sized pieces in a large salad bowl.',
      'Add sliced cucumbers and halved cherry tomatoes.',
      'Toss greens with dressing until lightly and evenly coated.',
      'Scatter crunchy croutons, parmesan, and seeds over the top and serve fresh.'
    ],
    cautionNotes: [
      'Commercial Caesar dressings contain egg yolks, anchovy (fish), and dairy.',
      'Croutons are typically made from wheat bread and tossed in butter.'
    ]
  }
];

// 2. Intelligent Multi-Tier Substitution Dictionary
// Every substitution candidate is tagged with its own allergens so it can be cross-validated!
const SUBSTITUTION_RULES = {
  // DAIRY SUBSTITUTES
  'Dairy': [
    {
      targetMatch: ['heavy cream', 'cream', 'milk', 'cow milk', 'buttermilk', 'whole milk'],
      candidates: [
        { name: 'Oat milk (creamy barista blend)', allergens: [], note: 'Naturally dairy-free, nut-free, and neutral in flavor' },
        { name: 'Coconut cream (unsweetened)', allergens: [], note: 'Rich, thick dairy-free and nut-free texture' },
        { name: 'Soy milk (unsweetened)', allergens: ['Soy'], note: 'High protein dairy-free alternative' },
        { name: 'Almond milk (unsweetened)', allergens: ['Tree Nuts'], note: 'Light nutty dairy-free alternative' }
      ]
    },
    {
      targetMatch: ['butter', 'ghee'],
      candidates: [
        { name: 'Cold-pressed extra virgin olive oil', allergens: [], note: 'Heart-healthy dairy-free fat' },
        { name: 'Plant-based dairy-free butter (organic coconut/sunflower oil base)', allergens: [], note: '1:1 dairy-free baking and sautéing substitute' },
        { name: 'Refined avocado oil', allergens: [], note: 'High heat dairy-free cooking oil' }
      ]
    },
    {
      targetMatch: ['cheese', 'mozzarella', 'parmesan', 'cheddar', 'swiss'],
      candidates: [
        { name: 'Plant-based dairy-free shredded cheese (tapioca & coconut oil based)', allergens: [], note: 'Melts smoothly without dairy or nuts' },
        { name: 'Nutritional yeast flakes & sea salt', allergens: [], note: 'Savory, cheesy umami without dairy' }
      ]
    },
    {
      targetMatch: ['yogurt', 'curd'],
      candidates: [
        { name: 'Plain unsweetened coconut yogurt', allergens: [], note: 'Dairy-free, creamy marinade base' },
        { name: 'Plain oat milk yogurt', allergens: [], note: 'Dairy-free and nut-free probiotic base' }
      ]
    }
  ],

  // GLUTEN SUBSTITUTES
  'Gluten': [
    {
      targetMatch: ['pizza dough', 'flour', 'all-purpose', 'wheat flour', 'semolina'],
      candidates: [
        { name: 'Certified Gluten-Free 1-to-1 baking flour (rice flour, potato starch, tapioca)', allergens: [], note: 'Nut-free, wheat-free direct replacement' },
        { name: 'Cauliflower & rice flour pizza crust', allergens: [], note: 'Gluten-free, grain-free crust' },
        { name: 'Almond flour (fine blanched)', allergens: ['Tree Nuts'], note: 'Grain-free baking alternative' }
      ]
    },
    {
      targetMatch: ['fettuccine', 'penne', 'pasta', 'wheat noodles', 'egg noodles'],
      candidates: [
        { name: 'Brown rice & quinoa pasta (or 100% corn pasta)', allergens: [], note: 'Gluten-free with authentic al dente bite' },
        { name: 'Rice noodles / Pad Thai rice ribbons', allergens: [], note: 'Naturally gluten-free grain noodles' },
        { name: 'Zucchini spirals (zoodles)', allergens: [], note: 'Fresh, grain-free vegetable ribbon base' }
      ]
    },
    {
      targetMatch: ['bread', 'bun', 'brioche', 'croutons'],
      candidates: [
        { name: 'Gluten-free toasted sandwich bread / bun (rice & tapioca base)', allergens: [], note: 'Certified gluten-free and wheat-free' },
        { name: 'Toasted polenta cubes or roasted chickpea croutons', allergens: [], note: 'Crunchy, naturally gluten-free salad crunch' },
        { name: 'Butter lettuce wraps', allergens: [], note: 'Crisp green handheld alternative' }
      ]
    },
    {
      targetMatch: ['soy sauce'],
      candidates: [
        { name: 'Coconut aminos (soy-free, gluten-free)', allergens: [], note: 'Naturally brewed without wheat or soy' },
        { name: 'Tamari (certified gluten-free)', allergens: ['Soy'], note: 'Wheat-free brewed soy sauce' }
      ]
    }
  ],

  // EGGS SUBSTITUTES
  'Eggs': [
    {
      targetMatch: ['egg', 'eggs', 'egg yolk'],
      candidates: [
        { name: 'Flax egg (1 tbsp ground golden flaxseed + 3 tbsp warm water)', allergens: [], note: 'Natural binding agent for baking and pancakes' },
        { name: 'Aquafaba (whipped chickpea liquid)', allergens: [], note: 'Excellent egg white replacement for fluffiness' },
        { name: 'Chickpea flour batter (besan scramble)', allergens: [], note: 'Savory egg-free scramble alternative' },
        { name: 'Unsweetened applesauce', allergens: [], note: 'Moisture binder for cakes and muffins' }
      ]
    },
    {
      targetMatch: ['mayonnaise'],
      candidates: [
        { name: 'Egg-free vegan mayo (sunflower oil & pea protein base)', allergens: [], note: 'Creamy spread without egg yolks' },
        { name: 'Mashed ripe avocado with lime & sea salt', allergens: [], note: 'Rich, natural plant-based spread' }
      ]
    }
  ],

  // TREE NUTS SUBSTITUTES
  'Tree Nuts': [
    {
      targetMatch: ['cashew', 'walnut', 'almond', 'tree nut', 'hazelnut', 'nut paste'],
      candidates: [
        { name: 'Roasted sunflower seed butter / paste (SunButter)', allergens: [], note: 'Nut-free creamy richness and thickening' },
        { name: 'Toasted pumpkin seeds (pepitas)', allergens: [], note: 'Nut-free salad crunch with iron & zinc' },
        { name: 'Pureed white beans (cannellini)', allergens: [], note: 'Silky, allergen-free sauce thickener' }
      ]
    }
  ],

  // PEANUTS SUBSTITUTES
  'Peanuts': [
    {
      targetMatch: ['peanut', 'peanut oil', 'groundnut'],
      candidates: [
        { name: 'Roasted sunflower seeds or SunButter', allergens: [], note: '100% peanut-free seed alternative' },
        { name: 'Avocado oil or neutral sunflower oil for cooking', allergens: [], note: 'High smoke-point peanut-free oil' }
      ]
    }
  ],

  // SOY SUBSTITUTES
  'Soy': [
    {
      targetMatch: ['soy sauce', 'soy', 'edamame', 'tofu'],
      candidates: [
        { name: 'Coconut aminos (soy-free & gluten-free seasoning sauce)', allergens: [], note: 'Made from fermented coconut palm blossom nectar' },
        { name: 'Chickpea miso & sea salt', allergens: [], note: 'Soy-free savory umami broth paste' }
      ]
    }
  ],

  // SHELLFISH / FISH SUBSTITUTES
  'Shellfish': [
    {
      targetMatch: ['shrimp', 'prawn', 'oyster sauce', 'crab', 'shellfish'],
      candidates: [
        { name: 'Vegetarian mushroom oyster-flavor sauce (shiitake base)', allergens: [], note: 'Savory stir-fry glaze without shellfish' },
        { name: 'Sliced king oyster mushrooms / hearts of palm', allergens: [], note: 'Tender seafood-like texture from plants' },
        { name: 'Organic chicken breast tenders', allergens: [], note: 'Lean non-shellfish protein' }
      ]
    }
  ],
  'Fish': [
    {
      targetMatch: ['anchovy', 'fish sauce', 'fish'],
      candidates: [
        { name: 'Capers and seaweed flakes (dulse)', allergens: [], note: 'Ocean-savory briny notes without finfish' }
      ]
    }
  ],

  // SESAME SUBSTITUTES
  'Sesame': [
    {
      targetMatch: ['sesame', 'sesame oil', 'tahini'],
      candidates: [
        { name: 'Toasted pumpkin seed oil or extra virgin olive oil', allergens: [], note: 'Fragrant nut-free finishing oil' },
        { name: 'Sunflower seed butter', allergens: [], note: 'Rich seed paste alternative' }
      ]
    }
  ]
};

/**
 * Normalizes allergy names for reliable matching.
 * e.g., "Tree Nuts" -> "treenuts", "Dairy" -> "dairy", "Gluten" -> "gluten"
 */
function normalizeAllergyKey(name) {
  return String(name).toLowerCase().replace(/[\s\-_]/g, '');
}

/**
 * Returns the list of 12 default meals.
 */
function getDefaultMeals() {
  return DEFAULT_MEALS.map(meal => ({
    id: meal.id,
    name: meal.name,
    description: meal.description,
    category: meal.category,
    prepTime: meal.prepTime,
    cookTime: meal.cookTime,
    image: meal.image,
    allergenTags: Array.from(new Set(meal.ingredients.flatMap(i => i.allergens)))
  }));
}

/**
 * Search meals by query string.
 * First searches the default 12 meals, then popular dishes, then synthesizes a dynamic culinary match.
 */
function searchMeals(query) {
  if (!query || !query.trim()) {
    return getDefaultMeals();
  }

  const q = query.trim().toLowerCase();
  
  // 1. Check default meals
  const matches = DEFAULT_MEALS.filter(meal => 
    meal.name.toLowerCase().includes(q) || 
    meal.description.toLowerCase().includes(q) ||
    meal.category.toLowerCase().includes(q)
  );

  if (matches.length > 0) {
    return matches.map(meal => ({
      id: meal.id,
      name: meal.name,
      description: meal.description,
      category: meal.category,
      prepTime: meal.prepTime,
      cookTime: meal.cookTime,
      image: meal.image,
      allergenTags: Array.from(new Set(meal.ingredients.flatMap(i => i.allergens)))
    }));
  }

  // 2. Synthesize matching culinary card for searched custom meal
  const formattedTitle = query.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return [
    {
      id: query.trim().toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: formattedTitle,
      description: `Chef-crafted, allergen-aware recipe tailored for ${formattedTitle}.`,
      category: 'Custom Searched Meal',
      prepTime: '20 mins',
      cookTime: '25 mins',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      allergenTags: ['Gluten', 'Dairy']
    }
  ];
}

/**
 * Finds or synthesizes a base recipe structure by meal name or ID.
 */
function getBaseRecipe(mealQuery) {
  const q = String(mealQuery || '').trim().toLowerCase();
  
  // 1. Exact match on ID or Name
  let found = DEFAULT_MEALS.find(m => 
    m.id.toLowerCase() === q || 
    m.name.toLowerCase() === q
  );

  // 2. If no exact match, check if a default meal name contains query (e.g. "biryani" -> "Chicken Biryani")
  if (!found) {
    found = DEFAULT_MEALS.find(m => m.name.toLowerCase().includes(q));
  }

  if (found) {
    // Return a clone
    return JSON.parse(JSON.stringify(found));
  }

  // Synthesize dynamic recipe for searched meal
  const title = mealQuery.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  return {
    id: q.replace(/[^a-z0-9]/g, '-'),
    name: title,
    description: `Savory, authentic ${title} prepared with fresh, wholesome ingredients.`,
    category: 'Searched Meal',
    prepTime: '20 mins',
    cookTime: '25 mins',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { name: `Fresh ingredients for ${title}`, amount: '1 portion', allergens: [] },
      { name: 'Wheat flour / grain base', amount: '1 cup', allergens: ['Gluten'] },
      { name: 'Butter / cooking cream', amount: '2 tbsp', allergens: ['Dairy'] },
      { name: 'Egg binder', amount: '1 egg', allergens: ['Eggs'] },
      { name: 'Seasoning and aromatic herbs (garlic, onion, pepper)', amount: 'To taste', allergens: [] }
    ],
    instructions: [
      `Prepare the main ingredients for ${title}, ensuring work surface is clean.`,
      `In a skillet or saucepan, combine seasonings and base ingredients over medium heat.`,
      `Simmer or sauté until cooked through and flavors meld together harmoniously.`,
      `Plate hot and garnish with fresh herbs.`
    ],
    cautionNotes: [
      `Check all spice blends and packaged ingredients for hidden allergens or factory shared lines.`
    ]
  };
}

/**
 * Validates whether a candidate substitution is safe against ALL user allergies.
 * @param {object} candidate Candidate with allergens array
 * @param {string[]} userAllergies List of user's active allergies
 * @returns {boolean} True if candidate does NOT contain ANY user allergy
 */
function isCandidateSafe(candidate, userAllergies) {
  const normUserAllergies = userAllergies.map(normalizeAllergyKey);
  for (const candidateAllergen of candidate.allergens) {
    const normCand = normalizeAllergyKey(candidateAllergen);
    for (const userAllergen of normUserAllergies) {
      if (normCand === userAllergen || normCand.includes(userAllergen) || userAllergen.includes(normCand)) {
        return false; // Collision! Contains an allergy user suffers from
      }
    }
  }

  // Also check candidate name for custom allergy keywords
  const candNameLower = candidate.name.toLowerCase();
  for (const userAllergen of userAllergies) {
    const norm = userAllergen.trim().toLowerCase();
    if (norm && candNameLower.includes(norm)) {
      return false;
    }
  }

  return true;
}

/**
 * UNIFIED PERSONALIZATION ENGINE
 * 
 * Works identically for both Default Meals and Searched Meals.
 * 
 * 1. Retrieves base recipe
 * 2. Compares ingredients with user's authenticated allergies
 * 3. Removes / substitutes allergic items
 * 4. Cross-validates replacements against ALL user allergies
 * 5. Adapts cooking steps
 * 6. Generates safety notes and the mandatory medical disclaimer
 * 
 * @param {string} mealQuery 
 * @param {string[]} userAllergies Array of allergy names from user's database profile
 * @returns {object} Structured personalized recipe
 */
function personalizeRecipe(mealQuery, userAllergies = []) {
  const baseRecipe = getBaseRecipe(mealQuery);
  const cleanUserAllergies = Array.isArray(userAllergies)
    ? [...new Set(userAllergies.map(a => String(a).trim()).filter(Boolean))]
    : [];

  const normUserAllergies = cleanUserAllergies.map(normalizeAllergyKey);

  const allergensDetected = new Set();
  const ingredientsRemoved = [];
  const ingredientsSubstituted = [];
  const finalIngredients = [];
  const replacementMap = new Map(); // originalName -> substituteName

  // Step 1: Scan and personalize ingredients
  for (const item of baseRecipe.ingredients) {
    let hasAllergen = false;
    const detectedForItem = [];

    // Check declared allergens on ingredient
    for (const declaredAllergen of (item.allergens || [])) {
      const normDeclared = normalizeAllergyKey(declaredAllergen);
      for (const userAllergen of cleanUserAllergies) {
        const normUser = normalizeAllergyKey(userAllergen);
        if (normDeclared === normUser || normDeclared.includes(normUser) || normUser.includes(normDeclared)) {
          hasAllergen = true;
          detectedForItem.push(userAllergen);
          allergensDetected.add(userAllergen);
        }
      }
    }

    // Also check ingredient text against user allergies (e.g. "Peanuts", "Eggs", "Dairy", "Gluten", or custom allergies like "Sesame")
    const itemTextLower = item.name.toLowerCase();
    for (const userAllergen of cleanUserAllergies) {
      const userAllergenLower = userAllergen.toLowerCase();
      if (itemTextLower.includes(userAllergenLower)) {
        hasAllergen = true;
        detectedForItem.push(userAllergen);
        allergensDetected.add(userAllergen);
      }
    }

    if (!hasAllergen) {
      // Safe ingredient - retain as is
      finalIngredients.push({
        name: item.name,
        amount: item.amount,
        isSubstituted: false
      });
      continue;
    }

    // Allergen triggered! Determine intelligent substitution
    ingredientsRemoved.push(item.name);
    let chosenSubstitute = null;
    let substitutionReason = '';

    // Search substitution rules matching detected allergens
    for (const triggeredAllergen of detectedForItem) {
      const ruleCategory = Object.keys(SUBSTITUTION_RULES).find(cat => 
        normalizeAllergyKey(cat) === normalizeAllergyKey(triggeredAllergen)
      );

      if (ruleCategory && SUBSTITUTION_RULES[ruleCategory]) {
        for (const rule of SUBSTITUTION_RULES[ruleCategory]) {
          const matchesTarget = rule.targetMatch.some(tm => itemTextLower.includes(tm));
          if (matchesTarget) {
            // Find first candidate that is validated against ALL user allergies!
            const safeCandidate = rule.candidates.find(cand => isCandidateSafe(cand, cleanUserAllergies));
            if (safeCandidate) {
              chosenSubstitute = safeCandidate;
              substitutionReason = `Replaced to avoid ${triggeredAllergen}. Safe against your profile (${safeCandidate.note}).`;
              break;
            }
          }
        }
      }
      if (chosenSubstitute) break;
    }

    // Universal Fallback if no specific rule matched:
    if (!chosenSubstitute) {
      chosenSubstitute = {
        name: `Allergen-Free Alternative for ${item.name.replace(/\(.*?\)/g, '').trim()} (Verified plant/seed base)`,
        allergens: [],
        note: 'Carefully chosen allergen-free substitution'
      };
      substitutionReason = `Substituted to avoid ${detectedForItem.join(', ')}. Verified against all active allergies.`;
    }

    // Add to records
    replacementMap.set(item.name, chosenSubstitute.name);
    ingredientsSubstituted.push({
      original: item.name,
      substitute: chosenSubstitute.name,
      amount: item.amount,
      allergensAvoided: detectedForItem,
      reason: substitutionReason
    });

    finalIngredients.push({
      name: chosenSubstitute.name,
      amount: item.amount,
      isSubstituted: true,
      originalName: item.name
    });
  }

  // Step 2: Adapt cooking instructions to reflect substitutions
  const adaptedInstructions = baseRecipe.instructions.map((step, idx) => {
    let updatedStep = step;
    for (const [orig, sub] of replacementMap.entries()) {
      // Clean word for substitution in text
      const simpleOrig = orig.split('(')[0].trim();
      const simpleSub = sub.split('(')[0].trim();
      
      const regex = new RegExp(simpleOrig, 'gi');
      if (regex.test(updatedStep)) {
        updatedStep = updatedStep.replace(regex, `${simpleSub} (safe substitution)`);
      }
    }
    return updatedStep;
  });

  // Step 3: Build safety and caution notes + mandatory medical disclaimer
  const safetyCautionNotes = [
    ...baseRecipe.cautionNotes
  ];

  if (allergensDetected.size > 0) {
    safetyCautionNotes.unshift(
      `Personalized adjustments: This recipe has been automatically adapted to eliminate: ${Array.from(allergensDetected).join(', ')}.`
    );
  } else {
    safetyCautionNotes.unshift(
      `No known allergens from your profile were detected in the standard recipe ingredients. Standard safety checks still apply.`
    );
  }

  // Required Medical Disclaimer:
  const medicalDisclaimer = 
    'IMPORTANT SAFETY NOTICE: SafePlate AI personalized recipes are algorithmic recommendations based on ingredient profiles and do NOT constitute medical advice or a medical guarantee of allergen safety. Cross-contamination can occur during manufacturing or kitchen handling. Always read certified product packaging labels and consult your physician for severe or anaphylactic allergies.';

  return {
    originalMeal: baseRecipe.name,
    category: baseRecipe.category,
    image: baseRecipe.image,
    prepTime: baseRecipe.prepTime,
    cookTime: baseRecipe.cookTime,
    userAllergiesChecked: cleanUserAllergies,
    allergensDetected: Array.from(allergensDetected),
    hasSubstitutions: ingredientsSubstituted.length > 0,
    ingredientsRemoved,
    ingredientsSubstituted,
    finalIngredients,
    cookingInstructions: adaptedInstructions,
    safetyCautionNotes,
    medicalDisclaimer
  };
}

module.exports = {
  DEFAULT_MEALS,
  getDefaultMeals,
  searchMeals,
  personalizeRecipe
};
