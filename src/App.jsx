import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORES = {
  shoprite:   { label: "ShopRite",     color: "#b83232", light: "#fdf1f1" },
  wholefoods: { label: "Whole Foods",  color: "#2d6a4f", light: "#edf7f2" },
  traderjoes: { label: "Trader Joe's", color: "#c4622d", light: "#fdf3ee" },
  any:        { label: "Any / Pantry", color: "#7a6a58", light: "#f5f1ec" },
};

const SECTIONS = [
  "Produce","Meat & Poultry","Seafood",
  "Dairy & Eggs","Pantry & Dry Goods",
  "Condiments & Spices","Bakery","Frozen","Beverages","Other"
];

const DAYS       = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MEALS      = ["Breakfast","Lunch","Dinner","Snack"];
const MEAL_TYPES = ["Breakfast","Lunch","Dinner","Snack","Dessert","Sauce","Creami"];

const RECIPE_EMOJI = {
  "Breakfast Protein Biscuits":         "🥐",
  "Veggie Egg Casserole":               "🥘",
  "Overnight Oats":                     "🥣",
  "In-N-Out Burger Bowls":              "🍔",
  "Smokey Chipotle Lime Sauce":         "🌶️",
  "Southwest Ranch":                    "🤠",
  "Avocado Lime Crema":                 "🥑",
  "Cottage Cheese PB Date Ice Cream":   "🍦",
  "Elite Protein Chicken Flatbread":    "🫓",
  "Bourbon Chicken & Rice":             "🍗",
  "Blueberry Banana Muffins":           "🫐",
  "Apple Baked Oats":                   "🍎",
  "Lentil Spinach Wraps":               "🫔",
  "Chocolate PB Muscle Builder Creami": "🍫",
  "Chicken & Cheese Bake":              "🧀",
};
const MEAL_EMOJI = {
  Breakfast:"🍳", Lunch:"🥗", Dinner:"🍽️",
  Snack:"🥨",    Dessert:"🍮", Sauce:"🫙", Creami:"🍦",
};
function recipeEmoji(r) {
  return RECIPE_EMOJI[r.name] || r.emoji || MEAL_EMOJI[r.mealType] || "🍴";
}

// ─── Default Recipes ──────────────────────────────────────────────────────────

const DEFAULT_RECIPES = [
  {
    id:"seed-1", name:"Breakfast Protein Biscuits", mealType:"Breakfast",
    tags:["Gluten Free","High Protein","Meal Prep"],
    sourceUrl:"https://www.maryswholelife.com/homemade-breakfast-protein-biscuits-gluten-free/",
    sourceType:"Website", defaultServings:12, prepTime:10, cookTime:15,
    caloriesPerServing:174, proteinPerServing:13, status:"Regular Rotation",
    cookMethod:"oven", cookTemp:450, storage:{fridge:"4 days",freezer:"3 months"},
    notes:"Don't overmix. Add 1-2 tbsp extra GF flour if batter is runny. Reheat: microwave 30-60s or air fryer 360° 2-3 min.",
    ingredients:[
      {id:"i1",name:"Ground chicken",qty:1,unit:"lb",section:"Meat & Poultry",store:"shoprite"},
      {id:"i2",name:"GF flour (King Arthur)",qty:1.5,unit:"cups",section:"Pantry & Dry Goods",store:"wholefoods"},
      {id:"i3",name:"Cottage cheese (Good Culture)",qty:0.5,unit:"cup",section:"Dairy & Eggs",store:"wholefoods"},
      {id:"i4",name:"Shredded cheddar cheese",qty:0.5,unit:"cup",section:"Dairy & Eggs",store:"shoprite"},
      {id:"i5",name:"Eggs",qty:5,unit:"large",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"i6",name:"Almond milk (unsweetened)",qty:0.5,unit:"cup",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"i7",name:"GF baking powder",qty:1.5,unit:"tsp",section:"Pantry & Dry Goods",store:"wholefoods"},
      {id:"i8",name:"Apple cider vinegar",qty:1,unit:"tsp",section:"Condiments & Spices",store:"traderjoes"},
      {id:"i9",name:"Olive oil",qty:1,unit:"tbsp",section:"Condiments & Spices",store:"shoprite"},
      {id:"i10",name:"Sage, garlic & onion powder",qty:1,unit:"tsp each",section:"Condiments & Spices",store:"traderjoes"},
      {id:"i11",name:"Salt, pepper, dried rosemary",qty:1,unit:"tsp each",section:"Condiments & Spices",store:"any"},
    ],
  },
  {
    id:"seed-2", name:"Veggie Egg Casserole", mealType:"Breakfast",
    tags:["High Protein","Gluten Free","Meal Prep","Low Carb","One Pan"],
    sourceUrl:"", sourceType:"Screenshot", defaultServings:6, prepTime:5, cookTime:25,
    caloriesPerServing:130, proteinPerServing:11, status:"Want to Try",
    cookMethod:"oven", cookTemp:350, storage:{fridge:"4 days",freezer:"2 months"},
    notes:"Macros estimated. Sauté veggies first for better texture. Bake 350°F in greased 8x8 dish, 20-25 min until center is set.",
    ingredients:[
      {id:"j1",name:"Eggs",qty:6,unit:"large",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"j2",name:"Cottage cheese",qty:0.5,unit:"cup",section:"Dairy & Eggs",store:"wholefoods"},
      {id:"j3",name:"Shredded veggies (broccoli/zucchini/spinach/carrots)",qty:1,unit:"cup",section:"Produce",store:"shoprite"},
      {id:"j4",name:"Shredded cheddar cheese",qty:0.5,unit:"cup",section:"Dairy & Eggs",store:"shoprite"},
      {id:"j5",name:"Garlic powder",qty:0.25,unit:"tsp",section:"Condiments & Spices",store:"any"},
      {id:"j6",name:"Salt",qty:1,unit:"pinch",section:"Condiments & Spices",store:"any"},
    ],
  },
  {
    id:"seed-3", name:"Overnight Oats", mealType:"Breakfast",
    tags:["High Protein","Meal Prep","Vegetarian","No Cook"],
    sourceUrl:"", sourceType:"Screenshot", defaultServings:1, prepTime:5, cookTime:0,
    caloriesPerServing:462, proteinPerServing:22, status:"Want to Try",
    cookMethod:"no-cook", cookTemp:0, storage:{fridge:"3 days",freezer:null},
    notes:"Macros estimated (includes both optional add-ins). Skip PB & maple syrup → ~350 cal, 18g pro. Prep the night before, fridge overnight.",
    ingredients:[
      {id:"k1",name:"Rolled oats",qty:0.75,unit:"cup",section:"Pantry & Dry Goods",store:"traderjoes"},
      {id:"k2",name:"Milk (dairy or soy)",qty:0.25,unit:"cup",section:"Dairy & Eggs",store:"shoprite"},
      {id:"k3",name:"Plain Greek yogurt",qty:0.25,unit:"cup",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"k4",name:"Chia seeds",qty:1,unit:"tsp",section:"Pantry & Dry Goods",store:"wholefoods"},
      {id:"k5",name:"Maple syrup (optional)",qty:1,unit:"tsp",section:"Condiments & Spices",store:"traderjoes"},
      {id:"k6",name:"Peanut butter (optional)",qty:1,unit:"tbsp",section:"Condiments & Spices",store:"traderjoes"},
    ],
  },
  {
    id:"seed-4", name:"In-N-Out Burger Bowls", mealType:"Lunch",
    tags:["High Protein","Meal Prep","Air Fryer","Gluten Free"],
    sourceUrl:"https://www.instagram.com/adamwolfefitness/", sourceType:"Instagram",
    defaultServings:6, prepTime:10, cookTime:30, caloriesPerServing:550, proteinPerServing:61,
    status:"Want to Try", cookMethod:"stovetop", cookTemp:0,
    storage:{fridge:"4 days",freezer:"2 months"},
    notes:"Potatoes: air fry 400°F 22 min, shake halfway. Beef: don't stir — let sit for char. Mix all spread ingredients separately. Add lettuce/onion/pickles fresh.",
    ingredients:[
      {id:"m1",name:"Ground beef (93/7)",qty:3,unit:"lb",section:"Meat & Poultry",store:"shoprite"},
      {id:"m2",name:"Russet potatoes",qty:20,unit:"oz",section:"Produce",store:"shoprite"},
      {id:"m3",name:"Fat-free cheddar cheese",qty:1,unit:"bag",section:"Dairy & Eggs",store:"shoprite"},
      {id:"m4",name:"Light mayo",qty:120,unit:"g",section:"Condiments & Spices",store:"shoprite"},
      {id:"m5",name:"Non-fat plain Greek yogurt",qty:100,unit:"g",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"m6",name:"Zero sugar ketchup",qty:40,unit:"g",section:"Condiments & Spices",store:"shoprite"},
      {id:"m7",name:"Mustard",qty:20,unit:"g",section:"Condiments & Spices",store:"any"},
      {id:"m8",name:"Pickle chips or dill relish",qty:4,unit:"tbsp",section:"Condiments & Spices",store:"shoprite"},
      {id:"m9",name:"Cherry tomatoes",qty:24,unit:"piece",section:"Produce",store:"traderjoes"},
      {id:"m10",name:"Shredded lettuce",qty:2,unit:"cups",section:"Produce",store:"shoprite"},
      {id:"m11",name:"Paprika",qty:2,unit:"tbsp",section:"Condiments & Spices",store:"any"},
      {id:"m12",name:"Salt, pepper, garlic & onion powder",qty:1.5,unit:"tsp ea",section:"Condiments & Spices",store:"any"},
      {id:"m13",name:"White vinegar",qty:1,unit:"tsp",section:"Condiments & Spices",store:"any"},
    ],
  },
  {
    id:"seed-5", name:"Smokey Chipotle Lime Sauce", mealType:"Sauce",
    tags:["No Cook","Gluten Free","Meal Prep","Low Cal"],
    sourceUrl:"https://www.instagram.com/hunt4shredz/", sourceType:"Instagram",
    defaultServings:2, prepTime:5, cookTime:0, caloriesPerServing:111, proteinPerServing:3,
    status:"Want to Try", cookMethod:"no-cook", cookTemp:0,
    storage:{fridge:"5 days",freezer:null},
    notes:"Macros estimated. Adjust chipotle for spice. Great on chicken, tacos, bowls. Don't freeze — texture breaks.",
    ingredients:[
      {id:"n1",name:"Light mayonnaise",qty:0.25,unit:"cup",section:"Condiments & Spices",store:"shoprite"},
      {id:"n2",name:"Non-fat plain Greek yogurt",qty:0.25,unit:"cup",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"n3",name:"Chipotle in adobo sauce",qty:1,unit:"tbsp",section:"Condiments & Spices",store:"traderjoes"},
      {id:"n4",name:"Lime juice",qty:1,unit:"tbsp",section:"Produce",store:"shoprite"},
      {id:"n5",name:"Honey",qty:1,unit:"tsp",section:"Condiments & Spices",store:"traderjoes"},
      {id:"n6",name:"Salt & pepper",qty:1,unit:"pinch",section:"Condiments & Spices",store:"any"},
    ],
  },
  {
    id:"seed-6", name:"Southwest Ranch", mealType:"Sauce",
    tags:["No Cook","High Protein","Gluten Free","Meal Prep","Low Cal"],
    sourceUrl:"https://www.instagram.com/hunt4shredz/", sourceType:"Instagram",
    defaultServings:2, prepTime:5, cookTime:0, caloriesPerServing:60, proteinPerServing:6,
    status:"Want to Try", cookMethod:"no-cook", cookTemp:0,
    storage:{fridge:"5 days",freezer:null},
    notes:"Macros estimated. Add ¼ cup water to thin for drizzle. Perfect on burrito bowls, tacos, salads.",
    ingredients:[
      {id:"o1",name:"Non-fat plain Greek yogurt",qty:0.5,unit:"cup",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"o2",name:"Light mayo",qty:2,unit:"tbsp",section:"Condiments & Spices",store:"shoprite"},
      {id:"o3",name:"Fresh lime juice",qty:1,unit:"tbsp",section:"Produce",store:"shoprite"},
      {id:"o4",name:"Garlic clove (minced)",qty:1,unit:"small",section:"Produce",store:"shoprite"},
      {id:"o5",name:"Chili powder, cumin, smoked paprika, onion powder",qty:1,unit:"tsp ea",section:"Condiments & Spices",store:"any"},
      {id:"o6",name:"Salt",qty:0.25,unit:"tsp",section:"Condiments & Spices",store:"any"},
      {id:"o7",name:"Water (to thin)",qty:0.25,unit:"cup",section:"Other",store:"any"},
    ],
  },
  {
    id:"seed-7", name:"Avocado Lime Crema", mealType:"Sauce",
    tags:["No Cook","High Protein","Gluten Free","Meal Prep","Vegetarian"],
    sourceUrl:"https://www.instagram.com/hunt4shredz/", sourceType:"Instagram",
    defaultServings:2, prepTime:5, cookTime:0, caloriesPerServing:160, proteinPerServing:8,
    status:"Want to Try", cookMethod:"no-cook", cookTemp:0,
    storage:{fridge:"2 days",freezer:null},
    notes:"Macros estimated. Blend everything smooth. Press plastic wrap directly on surface to slow browning. Best fresh — only 2 days.",
    ingredients:[
      {id:"p1",name:"Ripe avocado",qty:1,unit:"large",section:"Produce",store:"traderjoes"},
      {id:"p2",name:"Greek yogurt or light sour cream",qty:0.5,unit:"cup",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"p3",name:"Lime",qty:1,unit:"piece",section:"Produce",store:"shoprite"},
      {id:"p4",name:"Cumin",qty:1,unit:"tsp",section:"Condiments & Spices",store:"any"},
      {id:"p5",name:"Garlic clove",qty:1,unit:"piece",section:"Produce",store:"shoprite"},
      {id:"p6",name:"Salt & pepper",qty:1,unit:"pinch",section:"Condiments & Spices",store:"any"},
    ],
  },
  {
    id:"seed-8", name:"Cottage Cheese PB Date Ice Cream", mealType:"Creami",
    tags:["High Protein","Gluten Free","No Bake","Ninja Creami","Dessert","Meal Prep"],
    sourceUrl:"https://www.instagram.com/theshabishack/", sourceType:"Instagram",
    defaultServings:2, prepTime:10, cookTime:0, caloriesPerServing:490, proteinPerServing:30,
    status:"Want to Try", cookMethod:"no-cook", cookTemp:0,
    storage:{fridge:null,freezer:"2 weeks (in Creami pint)"},
    notes:"Macros estimated. Blend smooth, pour into Ninja Creami pint, freeze 16-24 hrs. No Creami? Freeze 4-6 hrs, sit at room temp 5 min, scoop.",
    ingredients:[
      {id:"q1",name:"Vanilla protein powder",qty:0.33,unit:"cup",section:"Pantry & Dry Goods",store:"wholefoods"},
      {id:"q2",name:"Low-fat cottage cheese",qty:1,unit:"cup",section:"Dairy & Eggs",store:"wholefoods"},
      {id:"q3",name:"Almond butter",qty:3,unit:"tbsp",section:"Condiments & Spices",store:"traderjoes"},
      {id:"q4",name:"Medjool dates (pitted)",qty:4,unit:"large",section:"Produce",store:"wholefoods"},
      {id:"q5",name:"Coconut milk",qty:0.67,unit:"cup",section:"Pantry & Dry Goods",store:"traderjoes"},
      {id:"q6",name:"Cinnamon",qty:1,unit:"tsp",section:"Condiments & Spices",store:"any"},
      {id:"q7",name:"Vanilla extract",qty:1,unit:"tsp",section:"Condiments & Spices",store:"any"},
    ],
  },
  {
    id:"seed-9", name:"Elite Protein Chicken Flatbread", mealType:"Lunch",
    tags:["High Protein","Gluten Free Option","Meal Prep","Low Carb","One Pan"],
    sourceUrl:"https://www.instagram.com/christianutrii/", sourceType:"Instagram",
    defaultServings:4, prepTime:10, cookTime:28, caloriesPerServing:235, proteinPerServing:28,
    status:"Want to Try", cookMethod:"oven", cookTemp:350,
    storage:{fridge:"4 days",freezer:"2 months"},
    notes:"Macros estimated. Translated from Portuguese. Press chicken thin on parchment. Layer cream cheese, spinach, tomato, mozzarella. Brush with egg wash, sprinkle breadcrumbs. Bake 350°F 25-30 min. Skip breadcrumbs for GF.",
    ingredients:[
      {id:"r1",name:"Ground chicken",qty:1,unit:"lb",section:"Meat & Poultry",store:"shoprite"},
      {id:"r2",name:"Cream cheese",qty:4,unit:"tbsp",section:"Dairy & Eggs",store:"shoprite"},
      {id:"r3",name:"Fresh spinach",qty:1,unit:"cup",section:"Produce",store:"traderjoes"},
      {id:"r4",name:"Tomato",qty:1,unit:"medium",section:"Produce",store:"shoprite"},
      {id:"r5",name:"Shredded mozzarella",qty:0.5,unit:"cup",section:"Dairy & Eggs",store:"shoprite"},
      {id:"r6",name:"Egg",qty:1,unit:"large",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"r7",name:"Breadcrumbs (or panko)",qty:3,unit:"tbsp",section:"Pantry & Dry Goods",store:"shoprite"},
      {id:"r8",name:"Salt & pepper",qty:1,unit:"pinch",section:"Condiments & Spices",store:"any"},
    ],
  },
  {
    id:"seed-10", name:"Bourbon Chicken & Rice", mealType:"Dinner",
    tags:["High Protein","Meal Prep","Air Fryer","Dairy Free"],
    sourceUrl:"https://www.instagram.com/adamwolfefitness/", sourceType:"Instagram",
    defaultServings:5, prepTime:10, cookTime:20, caloriesPerServing:527, proteinPerServing:55,
    status:"Want to Try", cookMethod:"stovetop", cookTemp:0,
    storage:{fridge:"4 days",freezer:"3 months"},
    notes:"Air fryer: 390°F 16 min, flip halfway. Cook jasmine rice separately. Sauce: melt butter, add garlic, soy sauce, BBQ sauce, syrup, ACV — simmer 2-3 min. Toss chicken in sauce, serve over rice.",
    ingredients:[
      {id:"s1",name:"Boneless skinless chicken breast",qty:2.5,unit:"lb",section:"Meat & Poultry",store:"shoprite"},
      {id:"s2",name:"Jasmine rice (dry)",qty:2,unit:"cups",section:"Pantry & Dry Goods",store:"traderjoes"},
      {id:"s3",name:"Sweet Baby Ray's BBQ (no sugar added)",qty:0.5,unit:"cup",section:"Condiments & Spices",store:"shoprite"},
      {id:"s4",name:"Low sodium soy sauce",qty:3,unit:"tbsp",section:"Condiments & Spices",store:"traderjoes"},
      {id:"s5",name:"Butter",qty:1,unit:"tbsp",section:"Dairy & Eggs",store:"shoprite"},
      {id:"s6",name:"Minced garlic",qty:1,unit:"tbsp",section:"Produce",store:"shoprite"},
      {id:"s7",name:"Maple syrup",qty:2,unit:"tbsp",section:"Condiments & Spices",store:"traderjoes"},
      {id:"s8",name:"Apple cider vinegar",qty:1,unit:"tbsp",section:"Condiments & Spices",store:"traderjoes"},
      {id:"s9",name:"Sesame seeds",qty:1,unit:"tbsp",section:"Condiments & Spices",store:"traderjoes"},
      {id:"s10",name:"Garlic powder, onion powder, paprika, salt, pepper",qty:1,unit:"tsp ea",section:"Condiments & Spices",store:"any"},
    ],
  },
  {
    id:"seed-11", name:"Blueberry Banana Muffins", mealType:"Snack",
    tags:["No Added Sugar","Meal Prep","Vegetarian","Freezer Friendly","Kid Friendly"],
    sourceUrl:"https://reallittlemeals.com/post/blueberry-banana-muffins-for-toddlers/",
    sourceType:"Website", defaultServings:10, prepTime:5, cookTime:22,
    caloriesPerServing:199, proteinPerServing:6, status:"Want to Try",
    cookMethod:"oven", cookTemp:350, storage:{fridge:"5 days",freezer:"3 months"},
    notes:"Use very ripe bananas. Fold blueberries in gently. No self-raising flour? Use 1½ cups AP flour + 1½ tsp baking powder + ¼ tsp salt. Reheat from frozen: microwave 15-20 sec.",
    ingredients:[
      {id:"t1",name:"Ripe bananas",qty:3,unit:"large",section:"Produce",store:"shoprite"},
      {id:"t2",name:"Blueberries",qty:0.75,unit:"cup",section:"Produce",store:"traderjoes"},
      {id:"t3",name:"Eggs",qty:2,unit:"large",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"t4",name:"Vanilla extract",qty:1,unit:"tsp",section:"Condiments & Spices",store:"any"},
      {id:"t5",name:"Self-raising flour",qty:1.5,unit:"cups",section:"Pantry & Dry Goods",store:"shoprite"},
    ],
  },
  {
    id:"seed-12", name:"Apple Baked Oats", mealType:"Breakfast",
    tags:["High Protein","Meal Prep","Vegetarian","Gluten Free Option","Single Serve"],
    sourceUrl:"https://www.instagram.com/reel/DVvsvdYjaWX/?igsh=MXI0MHNmeG5hNjhkNQ==",
    sourceType:"Instagram", defaultServings:1, prepTime:5, cookTime:25,
    caloriesPerServing:390, proteinPerServing:24, status:"Want to Try",
    cookMethod:"oven", cookTemp:350, storage:{fridge:"3 days",freezer:null},
    notes:"Macros estimated — includes protein icing. Combine everything in a greased oven-safe ramekin. Bake 350°F 25 min. Cool slightly before adding icing. Icing: mix 15g vanilla protein powder + 1½-2 tbsp almond milk until smooth.",
    ingredients:[
      {id:"u1",name:"Rolled oats",qty:0.5,unit:"cup",section:"Pantry & Dry Goods",store:"traderjoes"},
      {id:"u2",name:"Egg",qty:1,unit:"large",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"u3",name:"Almond milk (unsweetened)",qty:0.5,unit:"cup",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"u4",name:"Maple syrup",qty:1,unit:"tbsp",section:"Condiments & Spices",store:"traderjoes"},
      {id:"u5",name:"Apple",qty:0.5,unit:"piece",section:"Produce",store:"shoprite"},
      {id:"u6",name:"Vanilla protein powder",qty:15,unit:"g",section:"Pantry & Dry Goods",store:"wholefoods"},
      {id:"u7",name:"Cinnamon",qty:0.5,unit:"tsp",section:"Condiments & Spices",store:"any"},
      {id:"u8",name:"Baking powder",qty:0.25,unit:"tsp",section:"Pantry & Dry Goods",store:"any"},
      {id:"u9",name:"Chopped pecans (optional)",qty:2,unit:"tbsp",section:"Pantry & Dry Goods",store:"traderjoes"},
    ],
  },
  {
    id:"seed-13", name:"Lentil Spinach Wraps", mealType:"Lunch",
    tags:["High Protein","Vegan","Gluten Free","Meal Prep","Kid Friendly","3 Ingredients"],
    sourceUrl:"https://www.instagram.com/reel/DVroinWDjUT/?igsh=azd4YnVwZGRnZHl3",
    sourceType:"Instagram", defaultServings:5, prepTime:15, cookTime:20,
    caloriesPerServing:140, proteinPerServing:10, status:"Want to Try",
    cookMethod:"stovetop", cookTemp:0, storage:{fridge:"4 days",freezer:"2 months"},
    notes:"Macros estimated. Soak 1 cup red lentils 2+ hrs. Drain, blend with 1.5 cups water + spinach + seasoning until smooth. Cook in non-stick pan like a crepe. Fill with hummus, avocado, chicken.",
    ingredients:[
      {id:"v1",name:"Red lentils (dry)",qty:1,unit:"cup",section:"Pantry & Dry Goods",store:"wholefoods"},
      {id:"v2",name:"Water or broth",qty:1.5,unit:"cups",section:"Other",store:"any"},
      {id:"v3",name:"Fresh spinach",qty:1,unit:"cup",section:"Produce",store:"traderjoes"},
      {id:"v4",name:"Seasoning of choice",qty:1,unit:"tsp",section:"Condiments & Spices",store:"any"},
    ],
  },
  {
    id:"seed-14", name:"Chocolate PB Muscle Builder Creami", mealType:"Creami",
    tags:["High Protein","Gluten Free","No Bake","Ninja Creami","Low Cal"],
    sourceUrl:"", sourceType:"ChatGPT",
    defaultServings:1, prepTime:5, cookTime:0, caloriesPerServing:420, proteinPerServing:60,
    status:"Want to Try", cookMethod:"no-cook", cookTemp:0,
    storage:{fridge:null,freezer:"2 weeks (in Creami pint)"},
    notes:"Blend all ingredients fully. Freeze 24 hrs. Run on Lite Ice Cream setting. Xanthan gum is key for creamy texture — don't skip it.",
    ingredients:[
      {id:"w1",name:"Greek yogurt",qty:1,unit:"cup",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"w2",name:"Cottage cheese",qty:0.5,unit:"cup",section:"Dairy & Eggs",store:"wholefoods"},
      {id:"w3",name:"Chocolate protein powder",qty:1,unit:"scoop",section:"Pantry & Dry Goods",store:"wholefoods"},
      {id:"w4",name:"PB powder",qty:2,unit:"tbsp",section:"Condiments & Spices",store:"traderjoes"},
      {id:"w5",name:"Cocoa powder",qty:1,unit:"tbsp",section:"Pantry & Dry Goods",store:"traderjoes"},
      {id:"w6",name:"Medjool date",qty:1,unit:"piece",section:"Produce",store:"wholefoods"},
      {id:"w7",name:"Xanthan gum",qty:0.125,unit:"tsp",section:"Pantry & Dry Goods",store:"wholefoods"},
      {id:"w8",name:"Salt",qty:1,unit:"pinch",section:"Condiments & Spices",store:"any"},
    ],
  },
  {
    id:"seed-15", name:"Chicken & Cheese Bake", mealType:"Dinner",
    tags:["High Protein","Gluten Free Option","Meal Prep","One Pan","Low Carb"],
    sourceUrl:"", sourceType:"Screenshot",
    defaultServings:4, prepTime:10, cookTime:28, caloriesPerServing:355, proteinPerServing:33,
    status:"Want to Try", cookMethod:"oven", cookTemp:375,
    storage:{fridge:"4 days",freezer:"2 months"},
    notes:"Macros estimated. Press chicken into greased baking dish. Layer cream cheese, spinach, tomato, mozzarella. Beat egg over top, sprinkle breadcrumbs. Bake 375°F 25-30 min. Skip breadcrumbs for GF.",
    ingredients:[
      {id:"x1",name:"Ground chicken",qty:1,unit:"lb",section:"Meat & Poultry",store:"shoprite"},
      {id:"x2",name:"Cream cheese",qty:4,unit:"tbsp",section:"Dairy & Eggs",store:"shoprite"},
      {id:"x3",name:"Fresh spinach",qty:1,unit:"cup",section:"Produce",store:"traderjoes"},
      {id:"x4",name:"Tomato (sliced)",qty:1,unit:"medium",section:"Produce",store:"shoprite"},
      {id:"x5",name:"Grated mozzarella",qty:0.5,unit:"cup",section:"Dairy & Eggs",store:"shoprite"},
      {id:"x6",name:"Egg",qty:1,unit:"large",section:"Dairy & Eggs",store:"traderjoes"},
      {id:"x7",name:"Breadcrumbs",qty:3,unit:"tbsp",section:"Pantry & Dry Goods",store:"shoprite"},
      {id:"x8",name:"Salt & pepper",qty:1,unit:"pinch",section:"Condiments & Spices",store:"any"},
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function r2(n) { return Math.round(n * 100) / 100; }
function stableItemKey(n, s, sec) { return `${n.toLowerCase().replace(/\W+/g,"_")}__${s}__${sec}`; }
function getWeekStart(d = new Date()) {
  const w = new Date(d); const day = w.getDay();
  w.setDate(w.getDate() - day + (day === 0 ? -6 : 1)); w.setHours(0,0,0,0); return w;
}
function weekKey(d) { return d.toISOString().split("T")[0]; }
function fmtWeek(d) { return d.toLocaleDateString("en-US",{month:"short",day:"numeric"}); }
function addWeeks(d,n) { const w = new Date(d); w.setDate(w.getDate()+n*7); return w; }

const SEED_IDS = new Set(DEFAULT_RECIPES.map(d => d.id));

// ─── Firebase helpers ─────────────────────────────────────────────────────────

const HH_DOC = () => doc(db, "household", "main");

async function fbLoad() {
  try {
    const snap = await getDoc(HH_DOC());
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

async function fbSave(data) {
  try { await setDoc(HH_DOC(), data, { merge: true }); } catch(e) { console.error("Firebase save error", e); }
}

// ─── AI Parse ─────────────────────────────────────────────────────────────────

async function parseRecipeInput(input, isText = false) {
  const prompt = (isText
    ? `Parse this recipe from the following text (copied from Instagram or screenshot):\n\n---\n${input}\n---\n\nReturn ONLY valid JSON:`
    : `Use web search to fetch and parse this recipe URL: ${input}\n\nReturn ONLY valid JSON:`)
  + `
{
  "name": "string",
  "mealType": "Breakfast|Lunch|Dinner|Snack|Dessert|Sauce|Creami",
  "tags": ["string"],
  "sourceType": "${isText ? "Instagram" : "Website"}",
  "defaultServings": number,
  "prepTime": number,
  "cookTime": number,
  "caloriesPerServing": number,
  "proteinPerServing": number,
  "cookMethod": "oven|stovetop|no-cook",
  "cookTemp": number,
  "storage": { "fridge": "X days or null", "freezer": "X months or null" },
  "notes": "string",
  "ingredients": [{ "name":"string","qty":number,"unit":"string","section":"Produce|Meat & Poultry|Seafood|Dairy & Eggs|Pantry & Dry Goods|Condiments & Spices|Bakery|Frozen|Beverages|Other","store":"shoprite|wholefoods|traderjoes|any" }]
}
Store guide: shoprite=everyday basics, wholefoods=specialty/organic, traderjoes=TJ unique items, any=pantry staples.
If macros missing, ESTIMATE from USDA and note "Macros estimated" in notes field.`;

  const body = { model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:prompt}] };
  if (!isText) body.tools = [{type:"web_search_20250305",name:"web_search"}];
  const res  = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data = await res.json();
  const text = data.content.filter(b=>b.type==="text").map(b=>b.text).join("");
  const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
  return { ...parsed, id:uid(), sourceUrl:isText?"":input, status:"Want to Try", ingredients:(parsed.ingredients||[]).map(i=>({...i,id:uid()})) };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = { bg:"#f7f4ee",card:"#ffffff",border:"#e4ddd0",text:"#2a2118",muted:"#8a7a68",green:"#2d5a3d",greenL:"#edf5f0",terra:"#c4622d",terraL:"#fdf3ee",gold:"#b8881e" };
const btn = (bg=C.green,small=false) => ({ background:bg,color:"#fff",border:"none",padding:small?"5px 12px":"7px 16px",borderRadius:6,fontSize:small?11:12,cursor:"pointer",fontFamily:"sans-serif",letterSpacing:0.3,whiteSpace:"nowrap" });
const btnGhost = (small=false) => ({ background:"transparent",color:C.muted,border:`1px solid ${C.border}`,padding:small?"4px 10px":"6px 14px",borderRadius:6,fontSize:small?11:12,cursor:"pointer",fontFamily:"sans-serif" });
const inp = { border:`1px solid ${C.border}`,background:C.bg,padding:"8px 12px",borderRadius:6,fontSize:13,fontFamily:"Georgia, serif",color:C.text,outline:"none",width:"100%",boxSizing:"border-box" };
const card = { background:C.card,border:`1px solid ${C.border}`,borderRadius:10 };
const tag = (color="#6b5a3e",bg="#f0ebe2") => ({ background:bg,color,fontSize:10,padding:"2px 8px",borderRadius:20,fontFamily:"sans-serif",letterSpacing:0.3,whiteSpace:"nowrap" });
const overlay = { position:"fixed",inset:0,background:"rgba(0,0,0,0.48)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20 };
const modal = { background:"#fff",borderRadius:12,padding:28,maxWidth:540,width:"100%",maxHeight:"88vh",overflowY:"auto" };
const statusStyle = s => s==="Regular Rotation"?tag("#5a7a00","#f0f7d4"):s==="Archived"?tag("#888","#f0f0f0"):tag(C.terra,C.terraL);

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [recipes,      setRecipes]      = useState(DEFAULT_RECIPES);
  const [plan,         setPlan]         = useState({});
  const [checked,      setChecked]      = useState({});
  const [weekStart,    setWeekStart]    = useState(getWeekStart());
  const [tab,          setTab]          = useState("planner");
  const [synced,       setSynced]       = useState(false);
  const [saving,       setSaving]       = useState(false);

  const [addOpen,      setAddOpen]      = useState(false);
  const [addMode,      setAddMode]      = useState("url");
  const [urlInput,     setUrlInput]     = useState("");
  const [textInput,    setTextInput]    = useState("");
  const [parsing,      setParsing]      = useState(false);
  const [parseErr,     setParseErr]     = useState("");
  const [vaultFilter,  setVaultFilter]  = useState("All");
  const [planModal,    setPlanModal]    = useState(null);
  const [modalServings,setModalServings]= useState({});
  const [expandedId,   setExpandedId]   = useState(null);
  const [storeFilter,  setStoreFilter]  = useState("all");
  const [prepDone,     setPrepDone]     = useState({});
  const [prepExpanded, setPrepExpanded] = useState({});

  // ── Firebase real-time sync ──
  useEffect(() => {
    // Initial load
    fbLoad().then(data => {
      if (data) {
        const userRecipes = (data.recipes || []).filter(x => !SEED_IDS.has(x.id));
        setRecipes([...DEFAULT_RECIPES, ...userRecipes]);
        setPlan(data.plan || {});
        setChecked(data.checked || {});
        setPrepDone(data.prepDone || {});
      }
      setSynced(true);
    });

    // Real-time listener
    const unsub = onSnapshot(HH_DOC(), snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      const userRecipes = (data.recipes || []).filter(x => !SEED_IDS.has(x.id));
      setRecipes([...DEFAULT_RECIPES, ...userRecipes]);
      setPlan(data.plan || {});
      setChecked(data.checked || {});
      setPrepDone(data.prepDone || {});
    }, err => console.error("Firestore listener error", err));

    return () => unsub();
  }, []);

  // ── Save to Firebase ──
  const save = async (patch) => {
    setSaving(true);
    await fbSave(patch);
    setSaving(false);
  };

  const wk = weekKey(weekStart);

  // ── Plan helpers ──
  const getEntry   = (day, meal) => plan[wk]?.[`${day}-${meal}`] || null;
  const setEntry   = (day, meal, recipeId, servings) => {
    const next = { ...plan, [wk]: { ...(plan[wk]||{}), [`${day}-${meal}`]: { recipeId, servings } } };
    setPlan(next); save({ plan: next });
  };
  const clearEntry = (day, meal) => {
    const w = { ...(plan[wk]||{}) }; delete w[`${day}-${meal}`];
    const next = { ...plan, [wk]: w }; setPlan(next); save({ plan: next });
  };

  // ── Shopping list ──
  const shoppingList = (() => {
    const combined = {};
    Object.values(plan[wk]||{}).forEach(entry => {
      if (!entry?.recipeId) return;
      const recipe = recipes.find(r => r.id === entry.recipeId); if (!recipe) return;
      const scale = entry.servings / recipe.defaultServings;
      (recipe.ingredients||[]).forEach(ing => {
        const key = stableItemKey(ing.name, ing.store, ing.section);
        const q   = r2(ing.qty * scale);
        if (combined[key]) { combined[key].qty = r2(combined[key].qty + q); if (!combined[key].recipes.includes(recipe.name)) combined[key].recipes.push(recipe.name); }
        else combined[key] = { id:key, name:ing.name, qty:q, unit:ing.unit, store:ing.store, section:ing.section, recipes:[recipe.name] };
      });
    });
    return Object.values(combined);
  })();

  const wkChecked    = checked[wk] || {};
  const toggleCheck  = id => {
    const next = { ...checked, [wk]: { ...(checked[wk]||{}), [id]: !wkChecked[id] } };
    setChecked(next); save({ checked: next });
  };
  const toggleDone   = id => {
    const next = { ...prepDone, [wk]: { ...(prepDone[wk]||{}), [id]: !prepDone[wk]?.[id] } };
    setPrepDone(next); save({ prepDone: next });
  };
  const toggleExp    = id => setPrepExpanded(p => ({...p,[id]:!p[id]}));

  const filtered     = storeFilter === "all" ? shoppingList : shoppingList.filter(i=>i.store===storeFilter);
  const grouped      = Object.keys(STORES).reduce((acc,store) => {
    const bySection = {};
    SECTIONS.forEach(sec => { const items = filtered.filter(i=>i.store===store&&i.section===sec); if (items.length) bySection[sec]=items; });
    if (Object.keys(bySection).length) acc[store]=bySection; return acc;
  },{});

  const weekEntries  = Object.values(plan[wk]||{}).filter(Boolean);
  const uniqueR      = [...new Set(weekEntries.map(e=>e.recipeId))].length;
  const totalSvg     = weekEntries.reduce((s,e)=>s+(e.servings||0),0);
  const storesNeeded = [...new Set(shoppingList.filter(i=>i.store!=="any").map(i=>i.store))].length;
  const checkedCount = Object.values(wkChecked).filter(Boolean).length;

  const handleImport = async () => {
    const input = addMode==="url" ? urlInput.trim() : textInput.trim();
    if (!input) return;
    setParsing(true); setParseErr("");
    try {
      const recipe = await parseRecipeInput(input, addMode==="text");
      const next = [...recipes, recipe];
      setRecipes(next);
      const userRecipes = next.filter(x=>!SEED_IDS.has(x.id));
      save({ recipes: userRecipes });
      setUrlInput(""); setTextInput(""); setAddOpen(false);
    } catch { setParseErr("Couldn't parse that. Check your input and try again."); }
    finally { setParsing(false); }
  };

  const deleteRecipe = id => {
    const next = recipes.filter(r=>r.id!==id);
    setRecipes(next);
    const userRecipes = next.filter(x=>!SEED_IDS.has(x.id));
    save({ recipes: userRecipes });
  };

  const cycleStatus = id => {
    const next = recipes.map(r=>r.id!==id?r:{...r,status:r.status==="Want to Try"?"Regular Rotation":r.status==="Regular Rotation"?"Archived":"Want to Try"});
    setRecipes(next);
    const userRecipes = next.filter(x=>!SEED_IDS.has(x.id));
    save({ recipes: userRecipes });
  };

  if (!synced) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:C.bg,fontFamily:"Georgia,serif",color:C.muted,flexDirection:"column",gap:12}}>
      <div style={{width:32,height:32,border:`3px solid ${C.green}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}></div>
      <div>Loading your meal prep...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:"'Georgia','Times New Roman',serif",background:C.bg,minHeight:"100vh",color:C.text}}>

      {/* HEADER */}
      <div style={{background:C.text,padding:"16px 24px 0",position:"sticky",top:0,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
          <h1 style={{margin:0,fontSize:19,color:"#e8d5a3",letterSpacing:3,textTransform:"uppercase",fontWeight:400}}>Meal Prep</h1>
          <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:8}}>
            <button style={{background:"transparent",border:"1px solid #4a3a2a",color:"#a89070",padding:"3px 10px",borderRadius:4,cursor:"pointer",fontSize:13}} onClick={()=>setWeekStart(w=>addWeeks(w,-1))}>‹</button>
            <span style={{color:"#a89070",fontSize:12,fontStyle:"italic",minWidth:110,textAlign:"center"}}>Week of {fmtWeek(weekStart)}</span>
            <button style={{background:"transparent",border:"1px solid #4a3a2a",color:"#a89070",padding:"3px 10px",borderRadius:4,cursor:"pointer",fontSize:13}} onClick={()=>setWeekStart(w=>addWeeks(w,1))}>›</button>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
            {saving && <span style={{fontSize:10,color:"#a89070",fontFamily:"sans-serif",fontStyle:"italic"}}>saving...</span>}
            {tab==="shopping"&&shoppingList.length>0&&<span style={{background:C.green,color:"#fff",fontSize:11,padding:"3px 10px",borderRadius:20,fontFamily:"sans-serif"}}>{checkedCount}/{shoppingList.length} checked</span>}
            <span style={{color:"#6a5a48",fontSize:11,fontFamily:"sans-serif"}}>{recipes.length} recipes</span>
          </div>
        </div>
        <div style={{display:"flex",gap:2}}>
          {[["planner","Weekly Planner"],["recipes","Recipe Vault"],["shopping","Shopping List"],["prep","Prep Day"]].map(([id,label])=>(
            <button key={id} onClick={()=>{setTab(id);if(id==="recipes")setVaultFilter("All");}}
              style={{background:tab===id?C.bg:"transparent",color:tab===id?C.text:"#9a8a78",border:"none",padding:"8px 18px",fontSize:12,cursor:"pointer",borderRadius:"6px 6px 0 0",fontFamily:"Georgia,serif",letterSpacing:0.5}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"24px",maxWidth:940,margin:"0 auto"}}>

        {/* ══ WEEKLY PLANNER ══ */}
        {tab==="planner"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:10,flexWrap:"wrap"}}>
              <h2 style={{margin:0,fontSize:17,fontWeight:400,color:"#4a3520"}}>Weekly Meal Plan</h2>
              <button style={btn(C.green,true)} onClick={()=>setTab("shopping")}>View Shopping List →</button>
            </div>

            {/* Weeks with data */}
            {(()=>{
              const weeksWithData = Object.entries(plan).filter(([,e])=>Object.keys(e).length>0).map(([wkKey])=>wkKey).sort();
              if (!weeksWithData.length) return null;
              return (
                <div style={{background:"#fff8ee",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",marginBottom:14}}>
                  <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:7,fontFamily:"sans-serif"}}>Weeks with saved meals</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {weeksWithData.map(wkKey=>{
                      const d=new Date(wkKey+"T12:00:00"); const count=Object.keys(plan[wkKey]).length; const isCurrent=wkKey===wk;
                      return <button key={wkKey} onClick={()=>setWeekStart(new Date(wkKey+"T12:00:00"))}
                        style={{background:isCurrent?C.green:"#fff",color:isCurrent?"#fff":C.text,border:`1.5px solid ${isCurrent?C.green:C.border}`,padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",fontFamily:"sans-serif"}}>
                        {fmtWeek(d)} — {count} meal{count!==1?"s":""}
                      </button>;
                    })}
                  </div>
                </div>
              );
            })()}

            <div style={{overflowX:"auto",marginBottom:20}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr>
                    <th style={{padding:"8px 10px",textAlign:"left",color:C.muted,fontWeight:400,fontSize:10,textTransform:"uppercase",letterSpacing:1,borderBottom:`2px solid ${C.border}`,width:76}}>Meal</th>
                    {DAYS.map(d=><th key={d} style={{padding:"8px 6px",textAlign:"center",color:C.muted,fontWeight:400,fontSize:10,textTransform:"uppercase",letterSpacing:1,borderBottom:`2px solid ${C.border}`,minWidth:96}}>{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {MEALS.map(meal=>(
                    <tr key={meal}>
                      <td style={{padding:"8px 10px",color:C.muted,fontStyle:"italic",fontSize:11,borderBottom:`1px solid ${C.border}`}}>{meal}</td>
                      {DAYS.map(day=>{
                        const entry=getEntry(day,meal); const recipe=entry?recipes.find(r=>r.id===entry.recipeId):null;
                        return (
                          <td key={day} style={{padding:5,borderBottom:`1px solid ${C.border}`,verticalAlign:"top"}}>
                            {entry&&recipe?(
                              <div style={{background:C.greenL,borderRadius:7,padding:"7px 8px",cursor:"pointer",position:"relative",minHeight:50}} onClick={()=>{setModalServings({});setPlanModal({day,meal});}}>
                                <div style={{fontSize:11,color:C.green,fontWeight:600,lineHeight:1.3,marginBottom:2,paddingRight:12}}>{recipe.name}</div>
                                <div style={{fontSize:10,color:"#4a7c59",fontFamily:"sans-serif"}}>{entry.servings} svg</div>
                                <button onClick={e=>{e.stopPropagation();clearEntry(day,meal);}} style={{position:"absolute",top:3,right:5,background:"transparent",border:"none",color:"#9cb8a9",cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>×</button>
                              </div>
                            ):entry&&!recipe?(
                              <div style={{background:"#fff8ee",border:`1px solid #e8c97a`,borderRadius:7,padding:"6px 8px",minHeight:50,position:"relative"}}>
                                <div style={{fontSize:10,color:C.gold,fontFamily:"sans-serif"}}>⚠️ Recipe missing</div>
                                <button onClick={()=>clearEntry(day,meal)} style={{position:"absolute",top:3,right:5,background:"transparent",border:"none",color:"#c0a050",cursor:"pointer",fontSize:13,padding:0}}>×</button>
                              </div>
                            ):(
                              <div onClick={()=>{setModalServings({});setPlanModal({day,meal});}}
                                style={{border:`1.5px dashed ${C.border}`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",minHeight:50,cursor:"pointer",color:C.border,fontSize:18}}
                                onMouseEnter={e=>e.currentTarget.style.borderColor=C.green}
                                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>+</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{...card,padding:16,background:"#fff8ee"}}>
              <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:12,fontFamily:"sans-serif"}}>Week at a Glance</div>
              <div style={{display:"flex",gap:28,flexWrap:"wrap"}}>
                {[[uniqueR,"Recipes"],[totalSvg,"Servings"],[shoppingList.length,"Items to Buy"],[storesNeeded,"Stores"]].map(([v,l])=>(
                  <div key={l} style={{textAlign:"center"}}><div style={{fontSize:28,color:C.green,fontWeight:400,lineHeight:1}}>{v}</div><div style={{fontSize:10,color:C.muted,fontFamily:"sans-serif",marginTop:3}}>{l}</div></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ RECIPE VAULT ══ */}
        {tab==="recipes"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
              <h2 style={{margin:0,fontSize:17,fontWeight:400,color:"#4a3520"}}>Recipe Vault — {recipes.length} recipes</h2>
              <div style={{display:"flex",gap:6}}>
                <button style={btn(C.green)} onClick={()=>setAddOpen(true)}>+ Add Recipe</button>
              </div>
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
              {["All",...MEAL_TYPES].map(type=>{
                const active=vaultFilter===type; const emoji=type==="All"?"🍴":MEAL_EMOJI[type]||"";
                return <button key={type} onClick={()=>setVaultFilter(type)}
                  style={{background:active?C.text:"transparent",color:active?"#fff":C.muted,border:`1.5px solid ${active?C.text:C.border}`,padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",fontFamily:"sans-serif",transition:"all 0.15s"}}>
                  {emoji} {type}
                </button>;
              })}
            </div>

            {recipes.filter(r=>vaultFilter==="All"||r.mealType===vaultFilter).map(recipe=>(
              <div key={recipe.id} style={{...card,marginBottom:10,overflow:"hidden"}}>
                <div style={{padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"flex-start",gap:14}} onClick={()=>setExpandedId(expandedId===recipe.id?null:recipe.id)}>
                  <div style={{width:46,height:46,borderRadius:10,background:C.bg,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,userSelect:"none"}}>
                    {recipeEmoji(recipe)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:15}}>{recipe.name}</span>
                      <span style={tag(C.green,C.greenL)}>{recipe.mealType}</span>
                      <span style={statusStyle(recipe.status)}>{recipe.status}</span>
                    </div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:recipe.sourceUrl?5:0}}>
                      {(recipe.tags||[]).map(t=><span key={t} style={tag()}>{t}</span>)}
                    </div>
                    {recipe.sourceUrl&&(()=>{
                      const isIg=recipe.sourceUrl.includes("instagram.com");
                      const handle=isIg?"@"+recipe.sourceUrl.split("instagram.com/")[1]?.replace("/",""):null;
                      const domain=!isIg?new URL(recipe.sourceUrl).hostname.replace("www.",""):null;
                      return <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                        style={{fontSize:11,color:C.terra,fontFamily:"sans-serif",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:3}}>
                        ↗ {isIg?`Instagram ${handle}`:domain}
                      </a>;
                    })()}
                    {!recipe.sourceUrl&&recipe.sourceType==="ChatGPT"&&<span style={{fontSize:11,color:"#7a6a58",fontFamily:"sans-serif",fontStyle:"italic"}}>🤖 Generated by ChatGPT</span>}
                    {!recipe.sourceUrl&&recipe.sourceType==="Screenshot"&&<span style={{fontSize:11,color:"#c0392b",fontFamily:"sans-serif",fontStyle:"italic"}}>⚠️ No source link — add one</span>}
                  </div>
                  <div style={{display:"flex",gap:14,fontSize:11,color:C.muted,textAlign:"center",flexShrink:0}}>
                    {[[recipe.proteinPerServing+"g","protein"],[recipe.caloriesPerServing,"cal"],[recipe.defaultServings,"servings"],[(recipe.prepTime||0)+(recipe.cookTime||0)+"m","time"]].map(([v,l])=>(
                      <div key={l}><div style={{fontSize:16,color:C.green}}>{v}</div><div>{l}</div></div>
                    ))}
                  </div>
                  <span style={{color:C.border,fontSize:15,flexShrink:0}}>{expandedId===recipe.id?"▲":"▼"}</span>
                </div>

                {expandedId===recipe.id&&(
                  <div style={{borderTop:`1px solid ${C.border}`,padding:"14px 18px",background:"#fdfcfa"}}>
                    <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontFamily:"sans-serif"}}>Ingredients — {(recipe.ingredients||[]).length} items</div>
                    <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>
                      {(recipe.ingredients||[]).map(ing=>(
                        <div key={ing.id} style={{display:"flex",alignItems:"flex-start",gap:8,background:"#fff",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 10px"}}>
                          <span style={{width:7,height:7,borderRadius:"50%",background:STORES[ing.store]?.color||"#aaa",flexShrink:0,marginTop:4}}></span>
                          <span style={{flex:1,fontSize:12,lineHeight:1.4}}>{ing.name}</span>
                          <span style={{fontSize:11,color:C.muted,fontFamily:"sans-serif",flexShrink:0,marginLeft:8}}>{ing.qty} {ing.unit}</span>
                        </div>
                      ))}
                    </div>
                    {recipe.notes&&<div style={{fontSize:12,color:C.muted,fontStyle:"italic",background:"#f9f7f3",borderRadius:6,padding:"8px 12px",marginBottom:12}}>💡 {recipe.notes}</div>}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                      {recipe.sourceUrl?<a href={recipe.sourceUrl} target="_blank" rel="noreferrer" style={{fontSize:11,color:C.terra,fontFamily:"sans-serif"}}>↗ View Original Recipe</a>:<span/>}
                      <div style={{display:"flex",gap:6}}>
                        <button style={btnGhost(true)} onClick={()=>cycleStatus(recipe.id)}>↻ {recipe.status}</button>
                        <button style={btn(C.terra,true)} onClick={()=>deleteRecipe(recipe.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══ SHOPPING LIST ══ */}
        {tab==="shopping"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
              <h2 style={{margin:0,fontSize:17,fontWeight:400,color:"#4a3520"}}>Shopping List — {fmtWeek(weekStart)}</h2>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[["all","All Stores",C.text],...Object.entries(STORES).map(([k,v])=>[k,v.label,v.color])].map(([key,label,color])=>(
                  <button key={key} onClick={()=>setStoreFilter(key)}
                    style={{background:storeFilter===key?color:"transparent",color:storeFilter===key?"#fff":color,border:`1.5px solid ${color}`,padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",fontFamily:"sans-serif"}}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {shoppingList.length===0?(
              <div style={{...card,padding:48,textAlign:"center",color:C.muted}}>
                <div style={{fontSize:32,marginBottom:12}}>🛒</div>
                <div style={{fontStyle:"italic",marginBottom:6}}>No meals planned this week.</div>
                <button style={{...btn(C.green),marginTop:16}} onClick={()=>setTab("planner")}>Go to Planner</button>
              </div>
            ):(
              <div>
                <div style={{display:"flex",gap:16,marginBottom:18,flexWrap:"wrap"}}>
                  {[...new Set(shoppingList.filter(i=>i.store!=="any").map(i=>i.store))].map(store=>{
                    const s=STORES[store]; const count=shoppingList.filter(i=>i.store===store).length; const done=shoppingList.filter(i=>i.store===store&&wkChecked[i.id]).length;
                    return <div key={store} style={{display:"flex",alignItems:"center",gap:8,background:s.light,border:`1px solid ${s.color}20`,borderRadius:8,padding:"8px 14px"}}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:s.color}}></div>
                      <span style={{fontSize:13,color:s.color,fontFamily:"sans-serif",fontWeight:600}}>{s.label}</span>
                      <span style={{fontSize:11,color:C.muted,fontFamily:"sans-serif"}}>{done}/{count}</span>
                    </div>;
                  })}
                </div>

                {Object.entries(grouped).map(([storeKey,sections])=>{
                  const store=STORES[storeKey]; const storeItems=Object.values(sections).flat(); const storeDone=storeItems.filter(i=>wkChecked[i.id]).length;
                  return <div key={storeKey} style={{marginBottom:24}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:11,height:11,borderRadius:"50%",background:store.color}}></div>
                      <span style={{fontSize:13,color:store.color,letterSpacing:1,textTransform:"uppercase",fontFamily:"sans-serif",fontWeight:700}}>{store.label}</span>
                      <div style={{flex:1,height:1,background:store.color,opacity:0.18}}></div>
                      <span style={{fontSize:11,color:C.muted,fontFamily:"sans-serif"}}>{storeDone}/{storeItems.length}</span>
                    </div>
                    {Object.entries(sections).map(([section,items])=>(
                      <div key={section} style={{marginBottom:10}}>
                        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:5,paddingLeft:22,fontFamily:"sans-serif"}}>{section}</div>
                        {items.map(item=>{
                          const done=!!wkChecked[item.id];
                          return <div key={item.id} onClick={()=>toggleCheck(item.id)}
                            style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",marginBottom:3,background:done?"#f4f3f0":"#fff",border:`1px solid ${C.border}`,borderRadius:7,cursor:"pointer",opacity:done?0.5:1,transition:"opacity 0.15s"}}>
                            <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${done?store.color:"#ccc"}`,background:done?store.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              {done&&<span style={{color:"#fff",fontSize:11}}>✓</span>}
                            </div>
                            <span style={{flex:1,fontSize:13,textDecoration:done?"line-through":"none"}}>{item.name}</span>
                            <span style={{fontSize:12,color:C.muted,fontFamily:"sans-serif",fontWeight:500,flexShrink:0}}>{item.qty>0?item.qty:""} {item.unit}</span>
                            <span style={{fontSize:10,color:"#c0b090",fontFamily:"sans-serif",fontStyle:"italic",maxWidth:100,textAlign:"right",lineHeight:1.3}}>{item.recipes.join(", ")}</span>
                          </div>;
                        })}
                      </div>
                    ))}
                  </div>;
                })}

                {(()=>{
                  const pantry=filtered.filter(i=>i.store==="any"); if (!pantry.length) return null;
                  return <div style={{marginBottom:24}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:11,height:11,borderRadius:"50%",background:STORES.any.color}}></div>
                      <span style={{fontSize:13,color:STORES.any.color,letterSpacing:1,textTransform:"uppercase",fontFamily:"sans-serif",fontWeight:700}}>Pantry / Any Store</span>
                      <div style={{flex:1,height:1,background:STORES.any.color,opacity:0.18}}></div>
                    </div>
                    {pantry.map(item=>{
                      const done=!!wkChecked[item.id];
                      return <div key={item.id} onClick={()=>toggleCheck(item.id)}
                        style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",marginBottom:3,background:done?"#f4f3f0":"#fff",border:`1px solid ${C.border}`,borderRadius:7,cursor:"pointer",opacity:done?0.5:1}}>
                        <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${done?STORES.any.color:"#ccc"}`,background:done?STORES.any.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {done&&<span style={{color:"#fff",fontSize:11}}>✓</span>}
                        </div>
                        <span style={{flex:1,fontSize:13,textDecoration:done?"line-through":"none"}}>{item.name}</span>
                        <span style={{fontSize:12,color:C.muted,fontFamily:"sans-serif"}}>{item.qty>0?item.qty:""} {item.unit}</span>
                      </div>;
                    })}
                  </div>;
                })()}
              </div>
            )}
          </div>
        )}

        {/* ══ PREP DAY ══ */}
        {tab==="prep"&&(()=>{
          const recipeMap={};
          Object.values(plan[wk]||{}).forEach(entry=>{if(!entry?.recipeId)return;if(!recipeMap[entry.recipeId])recipeMap[entry.recipeId]=0;recipeMap[entry.recipeId]+=entry.servings;});
          const prepItems=Object.entries(recipeMap).map(([id,totalServings])=>{
            const recipe=recipes.find(r=>r.id===id); if(!recipe)return null;
            const scale=totalServings/recipe.defaultServings;
            return {recipe,totalServings,scaledIngredients:(recipe.ingredients||[]).map(ing=>({...ing,qty:r2(ing.qty*scale)}))};
          }).filter(Boolean);
          const METHOD_ORDER=["oven","stovetop","no-cook"];
          const METHOD_META={oven:{label:"🔥 Oven",sub:"Start these first — longest cook time",color:"#b83232"},stovetop:{label:"🍳 Stovetop",sub:"Run while oven is going",color:"#c4622d"},"no-cook":{label:"🥣 No-Cook / Assemble",sub:"Do last — or night before",color:"#2d6a4f"}};
          const grpd=METHOD_ORDER.reduce((acc,method)=>{const items=prepItems.filter(i=>(i.recipe.cookMethod||"stovetop")===method);if(items.length)acc[method]=items;return acc;},{});
          const totalMins=prepItems.reduce((s,i)=>s+(i.recipe.prepTime||0)+(i.recipe.cookTime||0),0);
          const doneCount=prepItems.filter(i=>prepDone[wk]?.[i.recipe.id]).length;

          return <div style={{maxWidth:700}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
              <div>
                <h2 style={{margin:"0 0 2px",fontSize:17,fontWeight:400,color:"#4a3520"}}>Prep Day — {fmtWeek(weekStart)}</h2>
                <div style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>Work through these in order top to bottom.</div>
              </div>
              {doneCount>0&&doneCount===prepItems.length&&<span style={{background:C.green,color:"#fff",fontSize:11,padding:"4px 14px",borderRadius:20,fontFamily:"sans-serif"}}>✓ All done — fridge is stocked!</span>}
            </div>

            {prepItems.length===0?(
              <div style={{...card,padding:48,textAlign:"center",color:C.muted}}>
                <div style={{fontSize:32,marginBottom:12}}>📋</div>
                <div style={{fontStyle:"italic",marginBottom:6}}>Nothing planned this week yet.</div>
                <button style={btn(C.green)} onClick={()=>setTab("planner")}>Go to Planner</button>
              </div>
            ):(
              <>
                <div style={{...card,padding:"12px 18px",marginBottom:20,background:"#fff8ee",display:"flex",gap:24,flexWrap:"wrap"}}>
                  {[[prepItems.length,"Recipes"],[prepItems.reduce((s,i)=>s+i.totalServings,0),"Total Servings"],[totalMins+"m","Active Time"],[`${doneCount}/${prepItems.length}`,"Completed"]].map(([v,l])=>(
                    <div key={l} style={{textAlign:"center"}}><div style={{fontSize:22,color:C.green,lineHeight:1}}>{v}</div><div style={{fontSize:10,color:C.muted,fontFamily:"sans-serif",marginTop:2}}>{l}</div></div>
                  ))}
                </div>
                {Object.entries(grpd).map(([method,items])=>{
                  const meta=METHOD_META[method];
                  return <div key={method} style={{marginBottom:24}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <span style={{fontSize:14,color:meta.color,fontFamily:"sans-serif",fontWeight:700}}>{meta.label}</span>
                      <div style={{flex:1,height:1,background:meta.color,opacity:0.2}}></div>
                      <span style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>{meta.sub}</span>
                    </div>
                    {items.map(({recipe,totalServings,scaledIngredients})=>{
                      const done=!!prepDone[wk]?.[recipe.id]; const exp=!!prepExpanded[recipe.id];
                      return <div key={recipe.id} style={{...card,marginBottom:10,opacity:done?0.65:1,overflow:"hidden"}}>
                        <div style={{padding:"14px 18px",display:"flex",alignItems:"flex-start",gap:14}}>
                          <div onClick={()=>toggleDone(recipe.id)} style={{width:22,height:22,borderRadius:6,border:`2px solid ${done?meta.color:C.border}`,background:done?meta.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,marginTop:1}}>
                            {done&&<span style={{color:"#fff",fontSize:13}}>✓</span>}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                              <span style={{fontSize:15,textDecoration:done?"line-through":"none",color:done?C.muted:C.text}}>{recipe.name}</span>
                              {recipe.cookTemp>0&&<span style={{...tag("#7a3a10","#fdeee6"),fontFamily:"sans-serif"}}>{recipe.cookTemp}°F</span>}
                              <span style={{...tag(C.muted,"#f0ebe2"),fontFamily:"sans-serif"}}>{(recipe.prepTime||0)+(recipe.cookTime||0)} min</span>
                              <span style={{...tag(C.green,C.greenL),fontFamily:"sans-serif"}}>Makes {totalServings} servings</span>
                            </div>
                            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                              {recipe.storage?.fridge&&<span style={{fontSize:11,color:C.muted,fontFamily:"sans-serif"}}>🧊 Fridge: <strong style={{color:C.text}}>{recipe.storage.fridge}</strong></span>}
                              {recipe.storage?.freezer&&<span style={{fontSize:11,color:C.muted,fontFamily:"sans-serif"}}>❄️ Freezer: <strong style={{color:C.text}}>{recipe.storage.freezer}</strong></span>}
                              {!recipe.storage?.freezer&&<span style={{fontSize:11,color:"#b06030",fontFamily:"sans-serif"}}>⚠️ Don't freeze</span>}
                            </div>
                          </div>
                          <button onClick={()=>toggleExp(recipe.id)} style={{...btnGhost(true),fontSize:11,flexShrink:0}}>{exp?"Hide":"Ingredients"}</button>
                        </div>
                        {exp&&(
                          <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 18px",background:"#fdfcfa"}}>
                            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontFamily:"sans-serif"}}>Scaled for {totalServings} servings</div>
                            <div style={{display:"flex",flexDirection:"column",gap:4}}>
                              {scaledIngredients.map(ing=>(
                                <div key={ing.id} style={{display:"flex",alignItems:"flex-start",gap:8,background:"#fff",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 10px"}}>
                                  <span style={{width:7,height:7,borderRadius:"50%",background:STORES[ing.store]?.color||"#aaa",flexShrink:0,marginTop:4}}></span>
                                  <span style={{flex:1,fontSize:12,lineHeight:1.4}}>{ing.name}</span>
                                  <span style={{fontSize:11,color:C.muted,fontFamily:"sans-serif",flexShrink:0,fontWeight:600,marginLeft:8}}>{ing.qty>0?ing.qty:"—"} {ing.unit}</span>
                                </div>
                              ))}
                            </div>
                            {recipe.notes&&<div style={{marginTop:10,fontSize:12,color:C.muted,fontStyle:"italic",background:"#f9f7f3",borderRadius:6,padding:"8px 12px"}}>💡 {recipe.notes}</div>}
                          </div>
                        )}
                      </div>;
                    })}
                  </div>;
                })}
              </>
            )}
          </div>;
        })()}
      </div>

      {/* ══ MODAL: Add Recipe ══ */}
      {addOpen&&(
        <div style={overlay} onClick={()=>setAddOpen(false)}>
          <div style={modal} onClick={e=>e.stopPropagation()}>
            <h3 style={{margin:"0 0 6px",fontSize:18,fontWeight:400}}>Add Recipe</h3>
            <p style={{margin:"0 0 16px",fontSize:13,color:C.muted,fontStyle:"italic"}}>Import from a website URL or paste text directly from Instagram.</p>
            <div style={{display:"flex",gap:0,marginBottom:16,border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",width:"fit-content"}}>
              {[["url","🔗  Website URL"],["text","📱  Paste Text / Instagram"]].map(([mode,label])=>(
                <button key={mode} onClick={()=>{setAddMode(mode);setParseErr("");}}
                  style={{background:addMode===mode?C.text:"#fff",color:addMode===mode?"#fff":C.muted,border:"none",padding:"8px 18px",fontSize:12,cursor:"pointer",fontFamily:"sans-serif"}}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{marginBottom:14}}>
              {addMode==="url"?(
                <>
                  <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:6,fontFamily:"sans-serif",textTransform:"uppercase",letterSpacing:1}}>Recipe URL</label>
                  <div style={{display:"flex",gap:8}}>
                    <input value={urlInput} onChange={e=>setUrlInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleImport()} placeholder="https://www.example.com/recipe..." style={inp}/>
                    <button style={{...btn(C.green),flexShrink:0,opacity:parsing?0.65:1}} onClick={handleImport} disabled={parsing}>{parsing?"Parsing…":"Import"}</button>
                  </div>
                  <div style={{fontSize:11,color:C.muted,marginTop:6,fontFamily:"sans-serif"}}>Works with: AllRecipes, NYT Cooking, Bon Appétit, food blogs, and more.</div>
                </>
              ):(
                <>
                  <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:6,fontFamily:"sans-serif",textTransform:"uppercase",letterSpacing:1}}>Paste Recipe Text</label>
                  <textarea value={textInput} onChange={e=>setTextInput(e.target.value)}
                    placeholder={"Paste the full Instagram caption or recipe text here...\n\nExample:\nChicken Fried Rice | 450 cals 38g protein\nMakes 4 meals:\n2 lbs chicken breast..."}
                    style={{...inp,height:160,resize:"vertical",fontFamily:"sans-serif",fontSize:12,lineHeight:1.5}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                    <div style={{fontSize:11,color:C.muted,fontFamily:"sans-serif"}}>Copy the full caption from Instagram, TikTok, or anywhere else.</div>
                    <button style={{...btn(C.green),opacity:parsing?0.65:1}} onClick={handleImport} disabled={parsing}>{parsing?"Parsing…":"Import"}</button>
                  </div>
                </>
              )}
              {parsing&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}><div style={{width:14,height:14,border:`2px solid ${C.green}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}></div><span style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>Claude is reading and parsing your recipe…</span></div>}
              {parseErr&&<div style={{fontSize:12,color:C.terra,marginTop:8,fontFamily:"sans-serif"}}>{parseErr}</div>}
            </div>
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:14,display:"flex",justifyContent:"flex-end"}}>
              <button style={btnGhost()} onClick={()=>{setAddOpen(false);setUrlInput("");setTextInput("");setParseErr("");}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Plan Meal ══ */}
      {planModal&&(
        <div style={overlay} onClick={()=>setPlanModal(null)}>
          <div style={modal} onClick={e=>e.stopPropagation()}>
            <h3 style={{margin:"0 0 4px",fontSize:18,fontWeight:400}}>{planModal.day} — {planModal.meal}</h3>
            <p style={{margin:"0 0 16px",fontSize:13,color:C.muted,fontStyle:"italic"}}>Pick a recipe and set how many servings.</p>
            {recipes.length===0?(
              <div style={{textAlign:"center",padding:24,color:C.muted,fontStyle:"italic"}}>
                <div>No recipes yet.</div>
                <button style={{...btn(C.green),marginTop:12}} onClick={()=>{setPlanModal(null);setAddOpen(true);}}>+ Add a Recipe</button>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
                {recipes.map(recipe=>{
                  const current=getEntry(planModal.day,planModal.meal); const isSelected=current?.recipeId===recipe.id;
                  const svgCount=modalServings[recipe.id]??(isSelected?current.servings:recipe.defaultServings);
                  return <div key={recipe.id}
                    style={{border:`1.5px solid ${isSelected?C.green:C.border}`,borderRadius:8,padding:"10px 14px",cursor:"pointer",background:isSelected?C.greenL:"#fff"}}
                    onClick={()=>{setEntry(planModal.day,planModal.meal,recipe.id,svgCount);setPlanModal(null);}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,color:isSelected?C.green:C.text,marginBottom:3,fontWeight:isSelected?600:400}}>{recipe.name}</div>
                        <div style={{fontSize:11,color:C.muted,fontFamily:"sans-serif"}}>{recipe.mealType} · {recipe.proteinPerServing}g protein · {recipe.caloriesPerServing} cal/svg</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                        <span style={{fontSize:11,color:C.muted}}>servings:</span>
                        <button style={{...btnGhost(true),padding:"2px 7px",fontSize:13}} onClick={()=>setModalServings(p=>({...p,[recipe.id]:Math.max(1,(p[recipe.id]??recipe.defaultServings)-1)}))}>−</button>
                        <span style={{minWidth:20,textAlign:"center",fontFamily:"sans-serif",fontSize:13}}>{svgCount}</span>
                        <button style={{...btnGhost(true),padding:"2px 7px",fontSize:13}} onClick={()=>setModalServings(p=>({...p,[recipe.id]:(p[recipe.id]??recipe.defaultServings)+1}))}>+</button>
                      </div>
                    </div>
                  </div>;
                })}
              </div>
            )}
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:14,display:"flex",justifyContent:"space-between"}}>
              {getEntry(planModal.day,planModal.meal)&&<button style={btn(C.terra)} onClick={()=>{clearEntry(planModal.day,planModal.meal);setPlanModal(null);}}>Remove Meal</button>}
              <button style={{...btnGhost(),marginLeft:"auto"}} onClick={()=>setPlanModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
