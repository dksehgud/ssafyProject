package com.ssafy.tigetting.reservation.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReservationEntity {

    private Long reservationId;

    private Long reservationGroupId;

    private Integer userId;              // users.userid
    private String mt20id;               // performances.mt20id

    private Long performanceSeatId;      // performance_seats.performance_seat_id

    private Integer price;

    private ReservationStatus status;

    private LocalDateTime reservedAt;
}