package com.splitme.util

import java.security.SecureRandom

object ShortCodeGenerator {
    private const val CHARACTERS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    private const val DEFAULT_LENGTH = 6
    private val random = SecureRandom()

    fun generate(length: Int = DEFAULT_LENGTH): String {
        val sb = StringBuilder(length)
        for (i in 0 until length) {
            val randomIndex = random.nextInt(CHARACTERS.length)
            sb.append(CHARACTERS[randomIndex])
        }
        return sb.toString()
    }
}
