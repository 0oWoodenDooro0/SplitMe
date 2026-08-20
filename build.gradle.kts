plugins {
    kotlin("jvm") version "2.4.10" apply false
    kotlin("plugin.serialization") version "2.4.10" apply false
    id("io.ktor.plugin") version "3.5.2" apply false
}

allprojects {
    repositories {
        mavenCentral()
    }
}

val npmInstallClient by tasks.registering(Exec::class) {
    workingDir = file("client")
    commandLine("npm", "install")
    inputs.file("client/package.json")
    outputs.dir("client/node_modules")
}

val buildClient by tasks.registering(Exec::class) {
    dependsOn(npmInstallClient)
    workingDir = file("client")
    commandLine("npm", "run", "build")
    inputs.dir("client/src")
    inputs.file("client/package.json")
    inputs.file("client/vite.config.ts")
    inputs.file("client/index.html")
    outputs.dir("client/dist")
}
