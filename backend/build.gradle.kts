plugins {
    kotlin("jvm") version "2.2.20"
    kotlin("plugin.serialization") version "2.2.20"
    application
}

group = "org.example"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    // Ktor Server
    implementation("io.ktor:ktor-server-core-jvm:3.3.2")
    implementation("io.ktor:ktor-server-netty-jvm:3.3.2")
    implementation("io.ktor:ktor-server-content-negotiation-jvm:3.3.2")
    implementation("io.ktor:ktor-serialization-jackson-jvm:3.3.2")
    implementation("io.ktor:ktor-server-cors-jvm:3.3.2")
    implementation("io.ktor:ktor-server-call-logging-jvm:3.3.2")
    implementation("io.ktor:ktor-server-default-headers-jvm:3.3.2")
    implementation("io.ktor:ktor-server-status-pages-jvm:3.3.2")
    implementation("io.ktor:ktor-server-websockets-jvm:3.3.2")
    implementation("io.ktor:ktor-server-rate-limit:3.3.2")
    implementation("io.ktor:ktor-server-auth-jvm:3.3.2")
    implementation("io.ktor:ktor-server-auth-jwt-jvm:3.3.2")

    // Logging
    implementation("ch.qos.logback:logback-classic:1.5.12")

    // KMongo (Coroutine)
    implementation("org.litote.kmongo:kmongo-coroutine:5.1.0")

    // Security
    implementation("at.favre.lib:bcrypt:0.10.2")
    implementation("com.auth0:java-jwt:4.4.0")

    // Dotenv for environment variables support
    implementation("io.github.cdimascio:dotenv-kotlin:6.4.1")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

    // HTTP client for external integrations (placeholder)
    implementation("io.ktor:ktor-client-core-jvm:3.3.2")
    implementation("io.ktor:ktor-client-cio-jvm:3.3.2")
    implementation("io.ktor:ktor-client-content-negotiation-jvm:3.3.2")
    implementation("io.ktor:ktor-client-logging-jvm:3.3.2")
    implementation("io.ktor:ktor-client-auth-jvm:3.3.2")
    // shopify
    implementation("com.channelape:shopify-sdk:2.9.3")

    // FAL AI official client
    implementation("ai.fal.client:fal-client-kotlin:0.7.1")

    // AWS
    implementation("software.amazon.awssdk:s3:2.39.1")

    // Testing
    testImplementation(kotlin("test"))
    testImplementation("io.ktor:ktor-server-tests-jvm:3.3.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
    testImplementation("io.kotest:kotest-runner-junit5:5.9.1")
    testImplementation("io.kotest:kotest-assertions-core:5.9.1")
    testImplementation("com.squareup.okhttp3:mockwebserver:4.12.0")
}

tasks.test {
    useJUnitPlatform()
}
kotlin {
    jvmToolchain(21)
}

application {
    // Ktor entry point
    mainClass.set("com.productkit.ApplicationKt")
}
