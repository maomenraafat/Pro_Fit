export class ApiFeatures {
  constructor(mongoooseQuery, queryString) {
    this.mongoooseQuery = mongoooseQuery;
    this.queryString = queryString;
  }

  paginate() {
    const PAGE_LIMIT = 5;
    let PAGE_NUMBER = this.queryString.page * 1 || 1;
    if (this.queryString.page <= 0) PAGE_NUMBER = 1;
    const SKIP = (PAGE_NUMBER - 1) * PAGE_LIMIT;
    this.PAGE_NUMBER = PAGE_NUMBER;
    this.mongoooseQuery.skip(SKIP).limit(PAGE_LIMIT);
    return this;
  }

  filter() {
    let filterObject = { ...this.queryString };
    let excludedQuery = ["page", "sort", "fields", "keywords"];
    excludedQuery.forEach((q) => {
      delete filterObject[q];
    });
    filterObject = JSON.stringify(filterObject);
    filterObject = filterObject.replace(
      /\b(gt|gte|lt|lte)\b/g,
      (match) => `$${match}`
    );
    filterObject = JSON.parse(filterObject);
    this.mongoooseQuery.find(filterObject);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      let sortedBy = this.queryString.sort.split(",").join(" ");
      this.mongoooseQuery.sort(sortedBy);
    }
    return this;
  }

  search() {
    if (this.queryString.keywords) {
      this.mongoooseQuery.find({
        $or: [
          { title: { $regex: this.queryString.keywords, $options: "i" } },
          { descripiton: { $regex: this.queryString.keywords, $options: "i" } },
        ],
      });
    }
    return this;
  }
  fields() {
    if (this.queryString.fields) {
      let fields = this.queryString.fields.split(",").join(" ");
      this.mongoooseQuery.select(fields);
    }
    return this;
  }
}
