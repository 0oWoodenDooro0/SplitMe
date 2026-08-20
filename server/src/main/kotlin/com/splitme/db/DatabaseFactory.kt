package com.splitme.db

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.TransactionManager
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction
import java.io.Closeable
import java.io.File
import java.sql.Connection

class DatabaseFactory(
    private val jdbcUrl: String? = null
) : Closeable {

    private var dataSource: HikariDataSource? = null
    var database: Database? = null
        private set

    fun init() {
        val url = jdbcUrl ?: run {
            val dbDir = File("data")
            if (!dbDir.exists()) {
                dbDir.mkdirs()
            }
            "jdbc:sqlite:data/splitme.db"
        }

        val config = HikariConfig().apply {
            this.jdbcUrl = url
            driverClassName = "org.sqlite.JDBC"
            maximumPoolSize = 10
            isAutoCommit = false
            transactionIsolation = "TRANSACTION_SERIALIZABLE"
            connectionInitSql = "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;"
            validate()
        }

        val ds = HikariDataSource(config)
        this.dataSource = ds
        val db = Database.connect(ds)
        this.database = db

        TransactionManager.manager.defaultIsolationLevel = Connection.TRANSACTION_SERIALIZABLE

        transaction(db) {
            SchemaUtils.create(
                RoomsTable,
                MembersTable,
                ItemsTable,
                SplitsTable,
                ExtraFeesTable
            )
        }
    }

    suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(Dispatchers.IO, database) { block() }

    override fun close() {
        dataSource?.close()
    }
}
