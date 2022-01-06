// exercise 8.1
const { v1: uuid } = require('uuid')


const { ApolloServer, gql } = require('apollo-server')

let authors = [
  {
    name: 'Robert Martin',
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963
  },
  {
    name: 'Fyodor Dostoevsky',
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821
  },
  {
    name: 'Joshua Kerievsky', // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  {
    name: 'Sandi Metz', // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
]

/*
 * Suomi:
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 *
 * English:
 * It might make more sense to associate a book with its author by storing the author's id in the context of the book instead of the author's name
 * However, for simplicity, we will store the author's name in connection with the book
*/

let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ['agile', 'patterns', 'design']
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'patterns']
  },
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'design']
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'crime']
  },
  {
    title: 'The Demon ',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'revolution']
  },
]

const typeDefs = gql`
  type Author {
    name: String!
    born: Int
    bookCount: Int
  }

  type Book {
    title: String!
    published: Int!
    author: String!
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
      author: String!
      published: Int!
      genres: [String!]!
    ): Book

    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
  }
` //end typeDefs


const resolvers = {
  Query: {
    // ex8.3
    allAuthors: () => authors,

    // ex8.2, 8.5 genre
    allBooks: (root, args) => {
      if (!args.author && !args.genre) {
        console.log(books)
        return books
      }
      else if (!args.genre) {
        return books.filter(e => e.author === args.author)
      }
      else if (!args.author) {
        return books.filter(e => e.genres.includes(args.genre))
      }
      // else return books by the author with a certain genre
      return books.filter(e => e.genres.includes(args.genre) && e.author === args.author)
    },

    // ex8.1
    bookCount: () => books.length,
    authorCount: () => {
      let authorsAlreadyInThere = []
      const uniqueAuthors = books.filter((e, i, arr) => {
        if (!authorsAlreadyInThere.includes(e.author)) {
          authorsAlreadyInThere.push(e.author)
          return true
        }
        return false
      })
      return uniqueAuthors.length
    },
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
    addBook: (root, args) => {
      const book = { ...args, id: uuid() }
      books = books.concat(book)

      // also saving author to authors array
      const newAuthor = {
        name: args.author,
        id: uuid(),
        born: null,
      }
      authors = authors.concat(newAuthor)
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