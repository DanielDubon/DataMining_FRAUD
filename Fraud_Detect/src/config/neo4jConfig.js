import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
    'neo4j+s://2f0d7d5b.databases.neo4j.io',
    neo4j.auth.basic('neo4j', 'ZQVK4-0bBcebkWYaLUpgdVcwERTbcWmkXpkEyemo7L0')
)

export default driver