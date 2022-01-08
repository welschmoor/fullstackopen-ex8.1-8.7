// exercise 8.1
const { v1: uuid } = require('uuid')
const { ApolloServer, gql, UserInputError } = require('apollo-server')

const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const Book = require('./models/book')
const Author = require('./models/author')
const MONGODB_URI = 'mongodb+srv://user:hundert@cluster0.ky3f3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'

console.log('connecting to', MONGODB_URI)
// I have added { useNewUrlParser: true } because console said so, useUnifiedTopology: true 
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })



const typeDefs = gql`
  type Author {
    name: String!
    born: Int
    bookCount: Int
    id: ID!
  }

  type Book {
    title: String!
    published: Int!
    author: Author # this used to be String!
    id: ID!
    genres: [String!]!
  }


  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]! #ex8.2 8.4 8.5
    allAuthors: [Author!]!
  }

  type Mutation {
    addBook(
      title: String!
      name: String!
      published: Int!
      genres: [String!]!
    ): Book

    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
  }
` //end typeDefs


// number of authors:   const authorlist = await Author.collection.countDocuments()

const resolvers = {
  Query: {
    // ex8.3
    allAuthors: async () => {
      const authorlist = await Author.find({})
      console.log(authorlist)
      return authorlist
    },

    // ex8.2, 8.5 genre
    allBooks: async (root, args) => {
      if (args.author) {
        const booklist = await Book.find({})
        console.log("booklist", booklist)
        return Book.find({ author: { name: args.author } })
      }
      const booklist = await Book.find({})
      console.log("booklist", booklist)
      return Book.find({})
    },


    // ex8.14
    bookCount: async () => await Book.collection.countDocuments(),
    authorCount: async () => await Author.collection.countDocuments(),
  },

  // ex 8.3, where name of the author matches we push it into array and count number of books in there
  Author: {
    bookCount: (root, args) => {
      const booksByAuthor = []

      books.forEach(e => {
        if (e.author === root.name) {
          booksByAuthor.push(e.title)
        }
      })
      return booksByAuthor.length
    }
  },

  // 8.6
  Mutation: {
    addBook: async (root, args) => {

      //ex 8.15
      if (args.title.length < 3) {
        throw new UserInputError("Book title WAAAAY too short!")
        return
      }
      if (args.name.length < 5) {
        throw new UserInputError("Author name WAAAAY too short!")
        return
      }

      const book = new Book({ ...args })
      const findAuthor = await Author.findOne({ name: args.name }) // if author not in DB 
      if (findAuthor) { // if author exists, we set book.author field to that author object
        book.author = findAuthor
      }


      try {
        if (!findAuthor) {      // if author does not exist then we save him to DB and to the book too
          const author = new Author({ name: args.name })
          const returnedAuthor = await author.save()
          book.author = returnedAuthor
        }
        await book.save()

      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
      return book
    },

    // ex 8.7
    editAuthor: (root, args) => {
      if (!args.name) { return null }

      const filteredAuthors = authors.filter(e => e.name !== args.name)
      const authorInQ = authors.find(e => e.name === args.name)
      authorInQ.born = args.setBornTo
      console.log(filteredAuthors.concat(authorInQ))
      return authorInQ
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})