const mongoClient = require("mongodb").MongoClient;
const state = {
  db: null,
};

module.exports.connect = function (done) {
  const url =
    "mongodb+srv://shopCart:BQ3SdWNxTtbh3oPh@cluster0.ko8bgxo.mongodb.net/";
  const dbname = "shoeCart";

  mongoClient.connect(url, (err, data) => {
    if (err) return done(err);
    state.db = data.db(dbname);
    done();
  });
};
module.exports.get = function () {
  return state.db;
};
