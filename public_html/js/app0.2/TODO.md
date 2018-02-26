# TODOs:
- Build out [RecipeAdditive.class.js](RecipeAdditive.class.js)
- Create **Additive.class.js** for fragrance oils, etc.
- Perhaps create **Liquid.class.js** just to store prices and notes
- Add 'dependencies' or 'requires' array to `app.defineInstanceProps()` to simplify when property values must be updated... may remove some error proneness
  - Also add 'to_update' function to define how to calculate the value
  - Maybe need a 'no_update' array also to prevent circular calculations and other errors
  - **Consideration:** how to update arrays (oils, liquids, additives, etc.)
  - All dependencies of the current property should be updated before the dependencies of the descendant properties, and so forth