package com.splitme.service

import com.splitme.repository.RoomRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory

class RoomCleanupScheduler(
    private val repository: RoomRepository,
    private val checkIntervalMillis: Long = 60 * 60 * 1000L, // 1 hour
    private val ttlMillis: Long = 7 * 24 * 60 * 60 * 1000L // 7 days
) {
    private val logger = LoggerFactory.getLogger(RoomCleanupScheduler::class.java)
    private var cleanupJob: Job? = null

    fun start(scope: CoroutineScope) {
        if (cleanupJob?.isActive == true) return
        cleanupJob = scope.launch {
            logger.info("RoomCleanupScheduler started with interval ${checkIntervalMillis}ms and TTL ${ttlMillis}ms")
            while (isActive) {
                try {
                    val threshold = System.currentTimeMillis() - ttlMillis
                    val cleanedCount = repository.cleanExpiredRooms(threshold)
                    if (cleanedCount > 0) {
                        logger.info("Cleaned up $cleanedCount expired room(s)")
                    }
                } catch (e: Exception) {
                    logger.error("Error during room cleanup cycle", e)
                }
                delay(checkIntervalMillis)
            }
        }
    }

    fun stop() {
        cleanupJob?.cancel()
        cleanupJob = null
        logger.info("RoomCleanupScheduler stopped")
    }

    fun isRunning(): Boolean = cleanupJob?.isActive == true
}
