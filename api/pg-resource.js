const strs = require('stringstream');

function tagsQueryString(tags, itemid, result) {
  /**
   * Challenge:
   * This function is recursive, and a little complicated.
   * Can you refactor it to be simpler / more readable?
   */
  const length = tags.length;
  return length === 0
    ? `${result};`
    : tags.shift() &&
        tagsQueryString(
          tags,
          itemid,
          `${result}($${tags.length + 1}, ${itemid})${length === 1 ? '' : ','}`
        );
}

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
    async saveNewItem({ item, image, user }) {
      return new Promise((resolve, reject) => {
        postgres.connect(async (err, client, done) => {
          try {
            const { title, description, tags } = item;
            const idFromTags = tags.map(tag => Number(tag['id']));

            const newItemQuery = {
              text: `INSERT INTO items(title, description,ownerid)
              VALUES ($1,$2,$3) RETURNING *;`,
              values: [title, description, user.id]
            };

            const newItem = await postgres.query(newItemQuery);
            const tagQuery = tagsQueryString(tags, newItem.rows[0].id, '');

            const newItemTagQuery = {
              text: `INSERT INTO itemtag (tagid,itemid) VALUES ${tagQuery}`,
              values: [...idFromTags]
            };

            const newItemTag = await postgres.query(newItemTagQuery);

            resolve(newItem);
          } catch (e) {
            // Something went wrong
            client.query('ROLLBACK', err => {
              if (err) {
                reject(err);
              }
              // release the client back to the pool
              done();
            });
            switch (true) {
              case /uploads_itemid_key/.test(e.message):
                throw 'This item already has an image.';
              default:
                throw e;
            }
          }
        });
      });
    }
  };
};
