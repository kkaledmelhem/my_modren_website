package com.khaledmelhem.website.repository;

import com.khaledmelhem.website.model.AnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AnalyticsRepository extends JpaRepository<AnalyticsEvent, Long> {

    long countByEventType(String eventType);

    long countByEventTypeAndCreatedAtAfter(String eventType, LocalDateTime after);
}
