public without sharing class appointmentValidtion {

    @AuraEnabled(cacheable=false)
    public static void slotIsBook(ID recordId){
        
        list<Appointment_Slot__c> result=[select isActive__c from Appointment_Slot__c where ID=:recordId];

        
        for(Appointment_Slot__c rec:result){
            rec.isActive__c=true;
        }
                
        update result;
        return;
    }

    public static time stringTimeToTimedatyp(string InputTime){
        List<String> timeParts = InputTime.split(':');
        Integer hours = Integer.valueOf(timeParts[0]);
        Integer minutes = Integer.valueOf(timeParts[1]);

        // Split seconds and milliseconds
        List<String> secondsParts = timeParts[2].split('\\.');
        Integer seconds = Integer.valueOf(secondsParts[0]);
        Integer milliseconds = Integer.valueOf(secondsParts[1]);

        Time userSelectedTime = Time.newInstance(hours, minutes, seconds, milliseconds);
        return userSelectedTime;
    }

    @AuraEnabled(cacheable=true)
    public static list<Appointment_Slot__c> appointmentSlotIsAvaliable(date AppointmentDate,String AppointmentTime) {
          
        time userSelectedTime=appointmentValidtion.stringTimeToTimedatyp(AppointmentTime);
        
        list<Appointment_Slot__c>  matchingAppointmentSlot=[
                                            select Start_Time__c,End_Time__c,isActive__c from Appointment_Slot__c 
                                            where 
                                            isActive__c=false AND 
                                            (
                                            Start_Time__c <=:userSelectedTime AND End_Time__c >=:userSelectedTime
                                            ) AND Appointment_Date__c =: AppointmentDate
                                             LIMIT 1
                                            ];

        System.debug(matchingAppointmentSlot);
        
        return matchingAppointmentSlot;
         
    }
}