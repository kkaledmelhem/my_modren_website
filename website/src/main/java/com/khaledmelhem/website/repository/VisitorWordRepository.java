package com.khaledmelhem.website.repository;

import com.khaledmelhem.website.model.VisitorWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisitorWordRepository extends JpaRepository<VisitorWord, Long> {

    List<VisitorWord> findByApprovedTrueOrderByCreatedAtDesc();

    boolean existsByIpHash(String ipHash);

    long countByApprovedTrue();
}
