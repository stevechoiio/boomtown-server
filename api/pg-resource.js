const strs = require('stringstream');

const tagsQueryString = (tags, itemid, result) => {
  /**
   * Challenge:
   * This function is recursive, and a little complicated.
   * Can you refactor it to be simpler / more readable?
   */

  return tags.length === 0
    ? `${result};`
    : tags.shift() &&
        tagsQueryString(
          tags,
          itemid,
          `${result}($${tags.length + 1}, ${itemid})${
            tags.length === 0 ? '' : ','
          }`
        );
};

module.exports = postgres => {
  return {
    async createUser({ fullname, email, password }) {
      const newUserInsert = {
        text: 'INSERT ', // @TODO: Authentication - Server
        values: [fullname, email, password]
      };
      try {
        const user = await postgres.query(newUserInsert);
        return user.rows[0];
      } catch (e) {
        switch (true) {
          case /users_fullname_key/.test(e.message):
            throw 'An account with this username already exists.';
          case /users_email_key/.test(e.message):
            throw 'An account with this email already exists.';
          default:
            throw 'There was a problem creating your account.';
        }
      }
    },
    async getUserAndPasswordForVerification(email) {
      const findUserQuery = {
        text: 'INSERT ', // @TODO: Authentication - Server
        values: [email]
      };
      try {
        const user = await postgres.query(findUserQuery);
        if (!user) throw 'User was not found.';
        return user.rows[0];
      } catch (e) {
        throw 'User was not found.';
      }
    },
    async getUserById(id) {
      /**
       *  @TODO: Handling Server Errors
       *
       *  Inside of our resource methods we get to determine when and how errors are returned
       *  to our resolvers using try / catch / throw semantics.
       *
       *  Ideally, the errors that we'll throw from our resource should be able to be used by the client
       *  to display user feedback. This means we'll be catching errors and throwing new ones.
       *
       *  Errors thrown from our resource will be captured and returned from our resolvers.
       *
       *  This will be the basic logic for this resource method:
       *  1) Query for the user using the given id. If no user is found throw an error.
       *  2) If there is an error with the query (500) throw an error.
       *  3) If the user is found and there are no errors, return only the id, email, fullname, bio fields.
       *     -- this is important, don't return the password!
       *
       *  You'll need to complete the query first before attempting this exercise.
       */

      /**
       *  Refactor the following code using the error handling logic described above.
       *  When you're done here, ensure all of the resource methods in this file
       *  include a try catch, and throw appropriate errors.
       *
       *  Here is an example throw statement: throw 'User was not found.'
       *  Customize your throw statements so the message can be used by the client.
       */

      const findUserQuery = {
        text: 'SELECT * FROM users WHERE id=$1;', // @TODO: Basic queries
        values: [id]
      };

      try {
        const user = await postgres.query(findUserQuery);

        if (!user) {
          throw 'there is no user with matching id';
        } else {
          return user;
        }
      } catch (e) {
        throw 'Unable to find user by id';
      }
      // -------------------------------
    },
    async getItems(idToOmit) {
      const query = {
        text: `SELECT * FROM items ${idToOmit ? 'WHERE ownerid != $1' : ''}`,
        values: idToOmit ? [idToOmit] : []
      };
      try {
        const items = await postgres.query(query);

        return items.rows;
      } catch (e) {
        throw 'Unable to retrieve list of all items';
      }
    },
    async getItemsForUser(id) {
      /**
       *  @TODO: Advanced queries
       *  Get all Items. Hint: You'll need to use a LEFT INNER JOIN among others
       */
      try {
        const items = await postgres.query({
          text: `SELECT * FROM items WHERE ownerid=$1;`,
          values: [id]
        });

        return items.rows;
      } catch (e) {
        throw 'Error getting items for the user id ';
      }
    },
    async getBorrowedItemsForUser(id) {
      const items = await postgres.query({
        text: `SELECT * FROM items WHERE borrowerid=$1;`,
        values: [id]
      });

      return items.rows;
    },
    async getTags() {
      const tags = await postgres.query({ text: `SELECT * FROM tags;` });

      return tags.rows;
    },
    async getTagsForItem(id) {
      const tagsQuery = {
        text: `SELECT * FROM tags WHERE id IN (SELECT tagid FROM itemtag WHERE itemid=$1 )`, // @TODO: Advanced queries
        values: [id] // 0
      };

      const tags = await postgres.query(tagsQuery);

      return tags.rows;
    },
    // async saveNewItem({ item, user }) {
    //   return new Promise((resolve, reject) => {
    //     postgres.connect((err, client, done) => {
    //       try {
    //         // Begin postgres transaction
    //         client.query('BEGIN', err => {
    //           // Convert image (file stream) to Base64
    //           const imageStream = image.stream.pipe(strs('base64'));

    //           let base64Str = '';
    //           imageStream.on('data', data => {
    //             base64Str += data;
    //           });

    //           imageStream.on('end', async () => {
    //             // Image has been converted, begin saving things
    //             const { title, description, tags } = item;
    //             // inser item to ITEM table
    //             const newItemQuery = {
    //               text: `INSERT INTO items (title, description,ownerid)
    //             VALUES ('$1', '$2', '$3') RETUNING *`, // @TODO: Advanced queries
    //               values: [title, description, user.id]
    //             };

    //             const newItem = await postgres.query(newItemQuery);
    //             // inser item to ITEM table
    //             const imageUploadQuery = {
    //               text:
    //                 'INSERT INTO uploads (itemid, filename, mimetype, encoding, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    //               values: [
    //                 item.id,
    //                 image.filename,
    //                 image.mimetype,
    //                 'base64',
    //                 base64Str
    //               ]
    //             };

    //             // Upload image
    //             const uploadedImage = await client.query(imageUploadQuery);
    //             const imageid = uploadedImage.rows[0].id;

    //             const newImageQuery = {
    //               text: `INSERT INTO items (imageurl)
    //             VALUES ('$1') RETUNING *`, // @TODO: Advanced queries
    //               values: [image.url]
    //             };

    //             // Insert image
    //             // @TODO
    //             // -------------------------------
    //             const newImage = await postgres.query(newImageQuery);

    //             // inser item-tag to ITEMTAG table
    //             const newTag = tagsQueryString(tags.id, item.id);

    //             const newItemTagQuery = {
    //               text: `INSERT INTO itemtag (tagid,itemid)
    //             VALUES ${newTag}`, // @TODO: Advanced queries
    //               values: [...tags]
    //             };

    //             const newItemTag = await postgres.query(newItemTagQuery);

    //             // Commit the entire transaction!
    //             client.query('COMMIT', err => {
    //               if (err) {
    //                 throw err;
    //               }
    //               // release the client back to the pool
    //               done();
    //               // Uncomment this resolve statement when you're ready!
    //               resolve(newItem.rows[0]);
    //               // -------------------------------
    //             });
    //           });
    //         });
    //       } catch (e) {
    //         // Something went wrong
    //         client.query('ROLLBACK', err => {
    //           if (err) {
    //             reject(err);
    //           }
    //           // release the client back to the pool
    //           done();
    //         });
    //         switch (true) {
    //           case /uploads_itemid_key/.test(e.message):
    //             throw 'This item already has an image.';
    //           default:
    //             throw e;
    //         }
    //       }
    //     });
    //   });
    // }
    async saveNewItem({ item, user }) {
      const createdItem = await postgres.connect((err, client, done) => {
        try {
          // Begin postgres transaction
          client.query('BEGIN', async err => {
            const { title, description, tags } = item;

            const tagArray = tags[0]['id'];

            // console.log('tags is:::');
            // console.log(tagArray);

            // inser item to ITEM table

            const newItemQuery = {
              text: `INSERT INTO items(title, description,ownerid)
              VALUES ($1,$2,$3) RETURNING *;`, // @TODO: Advanced queries
              values: [title, description, user.id]
            };

            const newItem = await postgres.query(newItemQuery);
            // console.log(`the newItemId is : ${newItem.rows[0].id}`);

            // inser item-tag to ITEMTAG table
            const tagQuery = tagsQueryString(tags, newItem.rows[0].id, '');
            // console.log('tagQuery is:');
            // console.log(tagQuery);

            const newItemTagQuery = {
              text: `INSERT INTO itemtag (tagid,itemid)
              VALUES ${tagQuery}`, // @TODO: Advanced queries
              values: [tagArray]
            };

            const newItemTag = await postgres.query(newItemTagQuery);
            // console.log('newItemTag is:');
            // console.log(newItemTag);
            console.log(newItem);
            return newItem;
          });
        } catch (err) {
          return err;
        }
      });
      console.log(createdItem);
      return createdItem;
    }
  };
};
/**
 *  @TODO: Adding a New Item
 *
 *  Adding a new Item to Posgtres is the most advanced query.
 *  It requires 3 separate INSERT statements.
 *
 *  All of the INSERT statements must:
 *  1) Proceed in a specific order.
 *  2) Succeed for the new Item to be considered added
 *  3) If any of the INSERT queries fail, any successful INSERT
 *     queries should be 'rolled back' to avoid 'orphan' data in the database.
 *
 *  To achieve #3 we'll ue something called a Postgres Transaction!
 *  The code for the transaction has been provided for you, along with
 *  helpful comments to help you get started.
 *
 *  Read the method and the comments carefully before you begin.
 */
