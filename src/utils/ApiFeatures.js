export class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  // paginate() {
  //   const PAGE_LIMIT = this.queryString.limit * 1 || 5;
  //   let PAGE_NUMBER = this.queryString.page * 1 || 1;
  //   if (this.queryString.page <= 0) PAGE_NUMBER = 1;
  //   const SKIP = (PAGE_NUMBER - 1) * PAGE_LIMIT;
  //   this.PAGE_NUMBER = PAGE_NUMBER;
  //   this.mongooseQuery.skip(SKIP).limit(PAGE_LIMIT);
  //   return this;
  // }
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 5;
    const skip = (page - 1) * limit;

    this.page = page;
    this.limit = limit;
    this.skip = skip;
    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

    return this;
  }

  // filter() {
  //   let filterObject = { ...this.queryString };
  //   let excludedQuery = ["page", "sort", "fields", "keywords"];
  //   excludedQuery.forEach((q) => {
  //     delete filterObject[q];
  //   });
  //   filterObject = JSON.stringify(filterObject);
  //   filterObject = filterObject.replace(
  //     /\b(gt|gte|lt|lte)\b/g,
  //     (match) => `$${match}`
  //   );
  //   filterObject = JSON.parse(filterObject);
  //   this.mongooseQuery.find(filterObject);
  //   return this;
  // }
  // filter() {
  //   const queryObj = { ...this.queryString }; // Make a copy of the query string
  //   const excludeFields = ["page", "sort", "limit", "fields", "keywords"];
  //   excludeFields.forEach((el) => delete queryObj[el]); // Remove fields not meant for filtering

  //   // Advanced filtering with lt, lte, gt, gte, and string matching
  //   let queryStr = JSON.stringify(queryObj);
  //   queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  //   const filters = JSON.parse(queryStr);

  //   // Apply string filters using regex for partial, case-insensitive matching
  //   Object.keys(filters).forEach((key) => {
  //     if (typeof filters[key] === "string" && !filters[key].startsWith("$")) {
  //       filters[key] = { $regex: filters[key], $options: "i" }; // Case-insensitive partial match
  //     }
  //   });

  //   this.mongooseQuery = this.mongooseQuery.find(filters);
  //   return this;
  // }
  filter() {
    const queryObj = { ...this.queryString }; // Make a copy of the query string
    const excludeFields = [
      "page",
      "sort",
      "limit",
      "fields",
      "keywords",
      "profitFoods",
      "allFoods",
      "trainerFoods",
      "profitMeals",
      "allMeals",
      "trainerMeals",
      "users",
    ];
    excludeFields.forEach((el) => delete queryObj[el]); // Remove fields not meant for filtering

    // Advanced filtering with lt, lte, gt, gte, and string matching
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    const filters = JSON.parse(queryStr);

    // Apply string filters using regex for partial, case-insensitive matching
    Object.keys(filters).forEach((key) => {
      if (typeof filters[key] === "string" && !filters[key].startsWith("$")) {
        filters[key] = { $regex: filters[key], $options: "i" }; // Case-insensitive partial match
      }
    });

    // Include the initial query conditions (like $or logic for Trainer) into the filtering
    this.mongooseQuery = this.mongooseQuery.find({
      ...filters,
      ...this.initialQuery,
    });

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      let sortedBy = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery.sort(sortedBy);
    }
    // else {
    //   // Default sort: prioritize 'Ready' status for dietAssessmentStatus
    //   this.mongooseQuery = this.mongooseQuery.sort({
    //     "traineeId.dietAssessmentStatus": -1,
    //   });
    // }
    else {
      // Default sort by the 'createdAt' field of 'traineeDietAssessment' from oldest to newest
      this.mongooseQuery.sort({
        "traineeId.traineeDietAssessment.dietAssessmentStatus": -1,
        "traineeId.traineeDietAssessment.createdAt": 1,
      });
    }
    return this;
  }

  search() {
    if (this.queryString.keywords) {
      this.mongooseQuery.find({
        $or: [
          { foodname: { $regex: this.queryString.keywords, $options: "i" } },
          { category: { $regex: this.queryString.keywords, $options: "i" } },
          { mealname: { $regex: this.queryString.keywords, $options: "i" } },
          { mealnote: { $regex: this.queryString.keywords, $options: "i" } },
          { planName: { $regex: this.queryString.keywords, $options: "i" } },
        ],
      });
    }
    return this;
  }
  fields() {
    if (this.queryString.fields) {
      let fields = this.queryString.fields.split(",").join(" ");
      this.mongooseQuery.select(fields);
    }
    return this;
  }
}
