package com.khaledmelhem.website.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.net.URI;

@Configuration
public class RedisConfig {

    @Value("${REDIS_URL:}")
    private String redisUrl;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        if (redisUrl == null || redisUrl.isBlank()) {
            // Fall back to localhost — will fail to connect but app won't crash
            return new LettuceConnectionFactory("localhost", 6379);
        }
        try {
            URI uri = URI.create(redisUrl);
            LettuceConnectionFactory factory = new LettuceConnectionFactory(uri.getHost(), uri.getPort());
            if (uri.getUserInfo() != null) {
                String password = uri.getUserInfo().contains(":")
                    ? uri.getUserInfo().split(":", 2)[1]
                    : uri.getUserInfo();
                factory.setPassword(password);
            }
            return factory;
        } catch (Exception e) {
            return new LettuceConnectionFactory("localhost", 6379);
        }
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }
}
