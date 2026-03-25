package com.khaledmelhem.website.config;

import io.lettuce.core.ClientOptions;
import io.lettuce.core.SslOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.net.URI;
import java.time.Duration;

@Configuration
public class RedisConfig {

    @Value("${REDIS_URL:}")
    private String redisUrl;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        if (redisUrl == null || redisUrl.isBlank()) {
            return new LettuceConnectionFactory("localhost", 6379);
        }
        try {
            URI uri = URI.create(redisUrl);
            boolean useSsl = uri.getScheme() != null && uri.getScheme().equals("rediss");

            RedisStandaloneConfiguration serverConfig = new RedisStandaloneConfiguration();
            serverConfig.setHostName(uri.getHost());
            serverConfig.setPort(uri.getPort());

            if (uri.getUserInfo() != null) {
                String[] parts = uri.getUserInfo().split(":", 2);
                if (parts.length == 2) {
                    serverConfig.setUsername(parts[0]);
                    serverConfig.setPassword(parts[1]);
                } else {
                    serverConfig.setPassword(parts[0]);
                }
            }

            LettuceClientConfiguration.LettuceClientConfigurationBuilder builder =
                LettuceClientConfiguration.builder()
                    .commandTimeout(Duration.ofSeconds(5));

            if (useSsl) {
                builder.useSsl().disablePeerVerification();
            }

            return new LettuceConnectionFactory(serverConfig, builder.build());

        } catch (Exception e) {
            return new LettuceConnectionFactory("localhost", 6379);
        }
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }
}
